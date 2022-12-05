import puppeteer from 'puppeteer';
import tesseract from 'node-tesseract-ocr';
import fs from 'fs';
import moment from 'moment';
import adMongoModel from '../ad.mongo.model';

class ParseService {
  
  get_parse_status() {
    return new Promise(async (res, rej) => {
      
      const total_ads = parseInt(process.env.AD_TOTAL as string);
      const current_ads = parseInt(process.env.AD_CURRENT as string); 
      const percent = parseFloat((current_ads/total_ads*100).toFixed(2));

      const start_time = moment(process.env.START_TIME as string);
      const last_time = moment(process.env.CURRENT_TIME as string);
      const current_time = (process.env.PARSE_STATUS == 'running')?moment():last_time;

      let time_lapsed_seconds = current_time.diff(start_time,'seconds');
      const time_lapsed_seconds_total = time_lapsed_seconds;
      const time_lapsed_days = Math.floor(time_lapsed_seconds/60/60/24);
      time_lapsed_seconds-= time_lapsed_days*24*60*60;

      const time_lapsed_hours = Math.floor(time_lapsed_seconds/60/60);
      time_lapsed_seconds-= time_lapsed_hours*60*60;

      const time_lapsed_minutes = Math.floor(time_lapsed_seconds/60);
      time_lapsed_seconds-= time_lapsed_minutes *60;

      const time_lapsed = `${time_lapsed_days}d ${time_lapsed_hours.toString().padStart(2,'0')}:${time_lapsed_minutes.toString().padStart(2,'0')}:${time_lapsed_seconds.toString().padStart(2,'0')}`;

      let time_remaining_seconds = 100*Math.ceil(time_lapsed_seconds_total/percent)-time_lapsed_seconds_total;
      if(time_remaining_seconds < 0) time_remaining_seconds = 0;

      const time_remaining_days = Math.floor(time_remaining_seconds/60/60/24);
      time_remaining_seconds-= time_remaining_days*24*60*60;

      const time_remaining_hours = Math.floor(time_remaining_seconds/60/60);
      time_remaining_seconds-= time_remaining_hours*60*60;

      const time_remaining_minutes = Math.floor(time_remaining_seconds/60);
      time_remaining_seconds-= time_remaining_minutes *60;

      const time_remaining = (process.env.PARSE_STATUS == 'running')?`${time_remaining_days}d ${time_remaining_hours.toString().padStart(2,'0')}:${time_remaining_minutes.toString().padStart(2,'0')}:${time_remaining_seconds.toString().padStart(2,'0')}`:'0d 00:00:00';

      res({
        status: process.env.PARSE_STATUS as string,
        total_ads: total_ads,
        current_ad: current_ads, 
        percent_completed: percent, 
        start_time: start_time,
        last_time: last_time,
        time_lapsed: time_lapsed,
        time_remaining: time_remaining      
      });        
    
    }).then(res=>{return res},err=>{return err});
  }

  parse_data(req: any, res: any) { 
    return new Promise(async (res, rej) => {
      try {
        process.env.PARSE_STATUS="running";
        process.env.START_TIME = moment().format('YYYY-MM-DD HH:mm:ss');
        process.env.AD_CURRENT = '0';
        process.env.AD_TOTAL = '';
        process.env.CURRENT_TIME = '';

        const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: '/usr/bin/google-chrome',
          userDataDir: "/home/node/app/.config/google-chrome"
        });
        const [page] = await browser.pages();
        page.setDefaultNavigationTimeout(60000);

        await page.setViewport({width: 1024, height: 768});
    
        console.log("Goto page...");
        await page.goto('https://www.avito.ru/krasnoyarsk/kvartiry/prodam/novostroyka', { waitUntil: "networkidle2", timeout: 60000 });      
        //await page.waitForSelector('[data-marker="catalog-serp"]');

        console.log("Setting view port...");

        console.log("Get options...");
        const options = await page.$$eval('option',el => el.map(e => [e.innerHTML,e.value]));
        
        console.log("Get sort parameter...");
        let s_param:any = options.find(item => item[0]=="По дате");
        
        console.log(`Date sort parameter: ${s_param[1]}`);
        console.log("Goto sorted page...");

        await page.goto(`${page.url()}?s=${s_param[1]}`, { waitUntil: "networkidle2", timeout: 60000 });
        //await page.waitForSelector('[data-marker="catalog-serp"]');
        
        let num_of_pages = await this.calculate_total_ads_count_and_num_of_pages(browser, req, s_param[1]);
        
        console.log(`Deleting no relevance ads...`);
        const del_result = await adMongoModel.deleteMany({ relevance: false, 'ad_data.ad_tag': 'avito' });

        if(!req.query.relevance || req.query.relevance == "false") {
          await adMongoModel.updateMany({ 'ad_data.ad_tag': 'domclick' }, { relevance: false });
        } else if(req.query.relevance == "true") {
          await adMongoModel.updateMany({ 'ad_data.ad_tag': 'domclick' }, { relevance: true });
          console.log(`Relevance: ${req.query.relevance}`); 
        }  

        let counter = 0;

        let start_page = 1;
        if(req.query.start_page && req.query.start_page > 0 && req.query.start_page <= num_of_pages) {
          start_page = parseInt(req.query.start_page);
        } 

        for (let current_page = start_page; current_page <= num_of_pages; current_page++)
        {
          let retries = 0;
          while(true) {
            try {   
              if (current_page > start_page) {
                console.log(`Goto sorted page ${current_page}...`);

                await page.goto(`${page.url().replace(/(.*)\?.*/,'$1')}?s=${s_param[1]}&p=${current_page}`, { waitUntil: "networkidle2", timeout: 60000 });
                 
                if((current_page % 5 == 0 || current_page == (num_of_pages-1)) && current_page < num_of_pages) {
                  const num_of_pages_new = await this.calculate_total_ads_count_and_num_of_pages(browser, req, s_param[1]);
                  num_of_pages = (num_of_pages_new)?num_of_pages_new:num_of_pages;                
                }    
              } 

              if (current_page == start_page && start_page > 1) {
                if(page.url().search(/^(.*p=)\d+(.*)$/)) {
                  await page.goto(page.url().replace(/^(.*p=)\d+(.*)$/,`$1${current_page}$2`), { waitUntil: "networkidle2" });
                } else {
                  await page.goto(`${page.url()}&p=${current_page}`, { waitUntil: "networkidle2" });
                }
              }  
              
              await page.waitForSelector('[data-marker="item-title"]');
              const click_elements = await page.$$eval('[data-marker="item-title"]', el => el.map(e => e.getAttribute('href'))); 
              console.log(`Found ${click_elements.length} elements on page ${current_page}.`);        

              for (let i = 0; i<click_elements.length; i++) {
                try {
                  counter++;
                  process.env.AD_CURRENT = (counter).toString();
                  process.env.CURRENT_TIME = moment().format('YYYY-MM-DD HH:mm:ss');              
              
                  await page.focus('a[href="'+click_elements[i]+'"]');
                  await page.click('a[href="'+click_elements[i]+'"]', { button : 'middle' }); 
                  
                  await browser.waitForTarget( async target => (await browser.pages())[1] != null)
                  console.log(`${i+1}: ${(await browser.pages()).map(e => e.url())}`);         

                  if((await browser.pages()).length == 2) {
                    const ob_page = (await browser.pages())[1];
                    ob_page.setDefaultNavigationTimeout(60000);
              
                    if( ob_page.url() != "about:blank" && ob_page.url() != 'chrome-error://chromewebdata/' ) {              
                      await ob_page.setViewport({width: 1024, height: 768});
                      await this.parse_page(ob_page);
                    } else {
                      i--;
                    }
                    
                    await ob_page.close(); 
                    await browser.waitForTarget( async target => (await browser.pages())[1] == null)
                  }
                } catch {
                  await this.delete_extra_pages(browser,1);
                }
              }  
              break;
            } catch {
              console.log(`Retry ${(retries+1)} of ${process.env.NUM_RETRIES as string}`);
              if (++retries == parseInt(process.env.NUM_RETRIES as string)) {
                console.log('Page parse error!')
                break;
              }
            }
          }
        }

        await browser.close();  
        
        const result = num_of_pages;

        if(result) {
          console.log(`DONE!`);
          res({result});
        } else {
          console.log(`Parse not complete!`);
          rej(result);
        }
      
        process.env.PARSE_STATUS="stopped";        
      } catch {}
    }).then(res=>{return res},err=>{return err});
  };
  
  parse_page(page: puppeteer.Page) {
    return new Promise(async (res, rej) => {
      let retries = 0;
      while(true) {
        if(await this.parse_page_(page)) {
          res(true);
          break;
        } else {
          console.log(`Retry ${(retries+1)} of ${process.env.NUM_RETRIES as string}`);
          try {
            await page.reload({ waitUntil: ["networkidle2", "domcontentloaded"], timeout: 60000 });
          } catch {}
          if (++retries == parseInt(process.env.NUM_RETRIES as string)) {
            console.log(`Parse "${page.url()}" fail!`);
            rej(false);
            break;
          }
        }
      }      
    }).then(res=>{return res},err=>{return err});
  };

  parse_page_(page: puppeteer.Page) {
    return new Promise(async (res, rej) => {
      try {        
        await page.waitForSelector('div[data-marker="item-view/item-params"]');
        
        let apartment_params: any; try { apartment_params = await page.$eval('div[data-marker="item-view/item-params"]', e => e.innerHTML); } catch { apartment_params = ''; }
        let house_params: any; try { house_params = await page.$eval('div[class*="style-item-view-house-params"]', e => e.innerHTML); } catch { house_params = ''; }

        let city_area: string; try { city_area = await page.$eval('[itemprop="address"]', e => e.querySelectorAll('div')[0].querySelectorAll('span')[0].querySelectorAll('span')[0].querySelectorAll('span')[1].innerHTML.replace(/(район|р-н)/,'').trim()); } catch { city_area = ''; }
        let housing_complex_name: string; try { housing_complex_name = await page.$eval('a[class$="js-nd-house-complex-link"]', e => e.innerHTML); } catch { housing_complex_name = ''; }
        const developer = (house_params.search(/<span[^>]*>Официальный застройщик[^\/]*<\/span>([^>]*)<\/li>/) > -1)?house_params.match(/<span[^>]*>Официальный застройщик[^\/]*<\/span>([^>]*)<\/li>/)[1]:'';
        let address: string; try { address = await page.$eval('[itemprop="address"]', e => e.querySelectorAll('span')[0].innerHTML); } catch { address = ''; }       
        const housing_class = '';
        const house_material = (house_params.search(/<span[^>]*>Тип дома[^\/]*<\/span>([^>]*)<\/li>/) > -1)?house_params.match(/<span[^>]*>Тип дома[^\/]*<\/span>([^>]*)<\/li>/)[1]:'';
        const finish_type = (apartment_params.search(/<span[^>]*>Отделка[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Отделка[^\/]*<\/span>([^>]*)<\/li>/)[1]:'';
        const deadline = (house_params.search(/<span[^>]*>Срок сдачи[^\/]*<\/span>([^>]*)<\/li>/) > -1)?house_params.match(/<span[^>]*>Срок сдачи[^\/]*<\/span>([^>]*)<\/li>/)[1]:'';
        let price: any; try { price = await page.$eval('span[itemprop="price"]', e => e.getAttribute("content")); } catch { price = ''; }
        const number_of_living_rooms = (apartment_params.search(/<span[^>]*>Количество комнат[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Количество комнат[^\/]*<\/span>([^>]*)<\/li>/)[1]:'';
        const floor = (apartment_params.search(/<span[^>]*>Этаж[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Этаж[^\/]*<\/span>([^>]*)<\/li>/)[1].replace(/\sиз\s/,'/'):'';
        const total_area = (apartment_params.search(/<span[^>]*>Общая площадь[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Общая площадь[^\/]*<\/span>([^>]*)<\/li>/)[1].replace(/&nbsp;(м²)?/,''):'';
        const living_space = (apartment_params.search(/<span[^>]*>Жилая площадь[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Жилая площадь[^\/]*<\/span>([^>]*)<\/li>/)[1].replace(/&nbsp;(м²)?/,''):'';
        const kitchen_area = (apartment_params.search(/<span[^>]*>Площадь кухни[^\/]*<\/span>([^>]*)<\/li>/) > -1)?apartment_params.match(/<span[^>]*>Площадь кухни[^\/]*<\/span>([^>]*)<\/li>/)[1].replace(/&nbsp;(м²)?/,''):'';
             
        await page.focus('[data-marker="item-phone-button/card"]');
        await page.click('[data-marker="item-phone-button/card"]', { button : 'left' });

        await page.waitForSelector('[data-marker="phone-popup/phone-image"]');
        let phone_img: any;
        let phone_number: string;  
        try { 
          phone_img = await page.$eval('[data-marker="phone-popup/phone-image"]', e => e.getAttribute('src')); 
          phone_number = (await this.recognize_phone(phone_img)).replace(/^8/,'7');
        } catch { 
          phone_number = '';
        }        

        let contact: string; try { contact = await page.$eval('[data-marker="seller-info/contact-person"]', e => e.querySelectorAll('div')[1].innerHTML); } catch { contact = ''; }
        
        let ad_title: string; try { ad_title = await page.$eval('span[data-marker="item-view/title-info"]', e => e.innerHTML.replace(/&nbsp;/g,' ')); } catch { ad_title = ''; }
        let ad_link: any; try { ad_link = page.url(); } catch { ad_link = ''; }
        let ad_id: string; try { ad_id = (ad_link.search(/^.*_\d+$/) > -1)?ad_link.match(/^.*\_(\d*)$/)[1]:''; } catch { ad_id = ''; }

        let ad_public_time: string; try { ad_public_time = (await page.$eval('span[data-marker="item-view/item-date"]', e => e.innerHTML.replace(/([\-><!\·]+)/g,''))).trim(); } catch { ad_public_time = ''; }
        ad_public_time = await this.avito_date_converter(ad_public_time);
        
        const ad_update_time = moment().format('YYYY-MM-DD HH:mm');        

        const data = {
          city_area: city_area,
          housing_complex_name: housing_complex_name,
          developer: developer,
          address: address,
          housing_class: housing_class,
          house_material: house_material,
          finish_type: finish_type,
          deadline: deadline,
          price: price,
          number_of_living_rooms: number_of_living_rooms,
          floor:  floor,
          total_area: total_area,
          living_space: living_space,
          kitchen_area: kitchen_area,
          phone_number: phone_number,
          contact: contact,
          relevance: true,
          ad_data: {
            ad_id: ad_id,
            ad_title: ad_title,
            ad_link: ad_link,
            ad_public_time: new Date(ad_public_time),
            ad_update_time: new Date(ad_update_time),
            ad_tag: 'avito'
          }
        };
  
        const ad_exist = await this.ad_exist(ad_id);        

        if(!ad_exist) {          
          const doc = new adMongoModel(data);
          const save_result = await doc.save();

          if(save_result) {
            res(true);
            console.log(`save result: true`);            
          } else {
            console.log(save_result);         
            rej(false);
          }
        } else {
          try {
            const doc_id = ad_exist._id.toString().replace(/^new ObjectId\(\"([0-9a-f]+)\"\)$/,'$1');            
            const upd_result: any = await adMongoModel.findOneAndUpdate({ '_id':doc_id, 'ad_data.ad_tag':'avito' }, data);

            if(Object.keys(upd_result).length > 0) {    
              res(true);
              console.log(`update result: true`);       
            } else {
              rej(false);
              console.log(upd_result);  
            }
          } catch (e) {
            console.log(e);
            rej(false);
          }
        }
        res(true);
      } catch (e) {
        rej(false);
      }

    }).then(res=>{return res},err=>{return err});
  };

  move_mouse_to_element(page: puppeteer.Page, selector: string) {
    return new Promise(async (res, rej) => {
      const element:any = await page.$(selector);
      const rect = await page.evaluate((element: any) => {
        const {top, left, bottom, right} = element.getBoundingClientRect();
        return {top, left, bottom, right};
      }, element);
      
      if(rect) {
        await page.mouse.move(rect.left+(rect.right-rect.left)/2,rect.top+(rect.bottom-rect.top)/2);  
        res(true);
      } else {
        rej(false);
      }
    }).then(res=>{return res},err=>{return err});
  };

  recognize_phone(phone_img: string) {
    return new Promise(async (res, rej) => {
      
      var base64Data = phone_img.replace(/^data:image\/png;base64,/, "");
      fs.writeFile("out.png", base64Data, 'base64', (err) => {if(err)console.log(err);});
      
      const config = {
        lang: "eng",
        oem: 3,
        psm: 7,
        load_system_dawg: 0,
        tessedit_char_whitelist: "0123456789",
      }
      const result = await tesseract.recognize("out.png", config);
      fs.unlink("out.png",(err) => {if(err)console.log(err);});

      if(result) {
        res(result.trim());
      } else {
        rej(false);
      }       
    }).then(res=>{return res},err=>{return err});
  };

  avito_date_converter(avito_date: string) {
    return new Promise(async (res, rej) => {
      
      avito_date = avito_date.replace(/^(\d{1,2}) января в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-01-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) февраля в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-02-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) марта в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-03-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) апреля в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-04-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) мая в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-05-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) июня в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-06-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) июля в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-07-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) августа в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-08-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) сентября в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-09-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) октября в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-10-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) ноября в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-11-')}$1 $2`);
      avito_date = avito_date.replace(/^(\d{1,2}) декабря в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-12-')}$1 $2`);
      avito_date = avito_date.replace(/^вчера в (\d{1,2}:\d{1,2})$/,`${moment().subtract(1, "days").format('YYYY-MM-DD')} $1`);
      const result: string = avito_date.replace(/^сегодня в (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-MM-DD')} $1`);

      if(result) {
        res(result.trim());
      } else {
        rej(false);
      }
    }).then(res=>{return res},err=>{return err});
  };

  ad_exist(ad_id: string) { 
    return new Promise(async (res, rej) => {
      let result: any;

      try {
        result = await adMongoModel.exists({ 'ad_data.ad_id': ad_id, 'ad_data.ad_tag': 'avito' }).exec();
      }
      catch { 
        rej(false);
      }

      if(result) {
        res(result);
      } else {        
        rej(false);
      }
          
    }).then(res=>{return res},rej=>{return rej});
  };

  calculate_total_ads_count_and_num_of_pages(browser: puppeteer.Browser, req: any, s_param: number){
    return new Promise(async (res, rej) => {
      console.log(`Calculate pages count...`); 
      let retries = 0;
      while(true) {
        const result = await this.calculate_total_ads_count_and_num_of_pages_(browser, req, s_param);
        if(result) {
          res(result);
          break;
        } else {
          await this.delete_extra_pages(browser,1);
          console.log(`Retry ${(retries+1)} of ${process.env.NUM_RETRIES as string}`);
          if (++retries == parseInt(process.env.NUM_RETRIES as string)) {
            console.log(`Calculate total ads count and num of pages fail!`);
            rej(false);
            break;
          }
        }
      }      
    }).then(res=>{return res},err=>{return err});
  };

  calculate_total_ads_count_and_num_of_pages_(browser: puppeteer.Browser, req: any, s_param: number) { 
    return new Promise(async (res, rej) => {
      const page = await browser.newPage();  
      try {        
        await page.goto((await browser.pages())[0].url(), { waitUntil: "networkidle2", timeout: 60000 });
        //await page.waitForSelector('[data-marker="catalog-serp"]');

        const click_pages = await page.$$eval('[data-marker^="page("]', el => el.map(e => e.innerHTML));
        let num_of_pages: number = (click_pages.length > 0)?parseInt(click_pages[click_pages.length-1]):1;
        
        if(req.query.num_of_pages && req.query.num_of_pages > 0 && req.query.num_of_pages < num_of_pages) {
          num_of_pages = req.query.num_of_pages;
        } 
  
        console.log(`Found ${num_of_pages} pages.`);
        
        console.log(`Calculate total ads count...`);

        const current_page_ads_count = (await page.$$eval('[data-marker="item-title"]', el => el.map(e => e.getAttribute('href')))).length; 

        await page.goto(`${page.url().replace(/(.*)\?.*/,'$1')}?s=${s_param}&p=${num_of_pages}`, { waitUntil: "networkidle2", timeout: 60000 });
        //await page.waitForSelector('[data-marker="catalog-serp"]');
        const last_page_ads_count = (await page.$$eval('[data-marker="item-title"]', el => el.map(e => e.getAttribute('href')))).length; 
        const total_ads = (num_of_pages-1)*current_page_ads_count+last_page_ads_count;
        
        console.log(`Total ads: ${total_ads}`); 
        process.env.AD_TOTAL = total_ads.toString();   
        
        await page.close();
        res(num_of_pages);
      } catch {
        if(page) await page.close();
        rej(false);
      }
    }).then(res=>{return res},rej=>{return rej});
  };

  delete_extra_pages(browser:puppeteer.Browser, leave_pages: number) { 
    return new Promise(async (res, rej) => {
      const num_pages = (await browser.pages()).length;
      if(num_pages > leave_pages) {
        for(let i=leave_pages; i<num_pages; i++) {
          (await browser.pages())[i].close();
        }              
      }
      res(true);
    }).then(res=>{return res},rej=>{return rej});
  };
}

export default new ParseService();