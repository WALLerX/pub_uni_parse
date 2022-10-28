import puppeteer from 'puppeteer';
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
          args: [
            '--no-sandbox',
            '--enable-logging',
            '--disable-infobar',
            '--excludeSwitches',
            '--useAutomationExtension',
            '--enable-automation',
            ' --v=1',
            '--disable-gpu',
            '--disable-extension',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--no-default-browser-check',
            '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'     
          ],
          executablePath: '/usr/bin/google-chrome',
          headless: true,
          dumpio: false,
          ignoreDefaultArgs: ["--enable-automation"],
          userDataDir: "/home/node/app/.config/google-chrome",
          defaultViewport: null,
          devtools: true,
          ignoreHTTPSErrors: true,
        });
        const [page] = await browser.pages();
        page.setDefaultNavigationTimeout(60000);
        
        console.log("Setting view port...");
        await page.setViewport({ width: 1366, height: 768 });      

        console.log("Goto page...");
        await page.goto('https://krasnoyarsk.cian.ru/kupit-kvartiru-novostroyki/', { waitUntil: 'networkidle0' }); 
        await page.waitForSelector('div[data-name="SummaryButtonWrapper"]:nth-child(1)');  
        
        try {
          await page.waitForSelector('div[data-testid="cookies-notification"]');
          await page.focus('div[data-testid="cookies-notification"] > div:nth-child(2) > button');
          await page.click('div[data-testid="cookies-notification"] > div:nth-child(2) > button', { button : 'left' }); 
        } catch {}

        console.log("Goto sorted page...");

        try {
          await (new Promise(r => setTimeout(r, 1000))); 
          await this.move_mouse_to_element(page, 'div[data-name="SummaryButtonWrapper"]:nth-child(1) > button');
          await page.focus('div[data-name="SummaryButtonWrapper"]:nth-child(1)');
          await page.click('div[data-name="SummaryButtonWrapper"]:nth-child(1) > button', { button : 'left' });
          await (new Promise(r => setTimeout(r, 1000)));
          await page.waitForSelector('div[data-name="SummaryButtonWrapper"]:nth-child(1) > div > div > div');
          await this.move_mouse_to_element(page, 'div[data-name="SummaryButtonWrapper"]:nth-child(1) > div > div > div > div:nth-child(8)');
          await page.focus('div[data-name="SummaryButtonWrapper"]:nth-child(1) > div > div > div');
          await page.click('div[data-name="SummaryButtonWrapper"]:nth-child(1) > div > div > div > div:nth-child(8)', { button : 'left' });
          await (new Promise(r => setTimeout(r, 1000)));
        } catch {
          await page.goto('https://krasnoyarsk.cian.ru/cat.php?deal_type=sale&engine_version=2&object_type[0]=2&offer_type=flat&region=4827&sort=creation_date_desc', { waitUntil: 'networkidle2' }); 
          await (new Promise(r => setTimeout(r, 2000)));            
        }  

        if(page.url().search(/webim\.ru/) > -1) {
          throw 'bad_url';
        }          

        await page.waitForSelector('article[data-name="CardComponent"]');

        let num_of_pages = await this.calculate_total_ads_count_and_num_of_pages(browser, req);

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

        for (let current_page = start_page; current_page <= num_of_pages; current_page++) {            
          let retries = 0;
          while(true) {
            try {
              await this.delete_extra_pages(browser,1);

              if (current_page > start_page) {
                const li_elements = await page.$$eval('div[data-name="Pagination"] > div > ul > li > *', el => el.map(e => e.innerHTML));
                const li_index = li_elements.indexOf(current_page.toString())+1;
                await page.waitForSelector(`div[data-name="Pagination"] > div > ul > li:nth-child(${li_index}) > a`);
                const new_page_link: any = 'https://krasnoyarsk.cian.ru'+(await page.$eval(`div[data-name="Pagination"] > div > ul > li:nth-child(${li_index}) > a`,e => e.getAttribute('href')?.replace(/https:\/\/krasnoyarsk\.cian\.ru/,'').replace(/&sort=creation_date_desc/,'')))+'&sort=creation_date_desc';
                await page.goto(new_page_link);

                if(page.url().search(/webim\.ru/) > -1) {
                  throw 'bad_url';
                }

                if((current_page % 5 == 0 || current_page == (num_of_pages-1)) && current_page < num_of_pages) {
                  const num_of_pages_new = await this.calculate_total_ads_count_and_num_of_pages(browser, req);
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

              await page.waitForSelector('div[data-name="LinkArea"] > a');
              const click_elements = await page.$$eval('div[data-name="LinkArea"] > a', el => el.map(e => e.getAttribute('href'))); 
              console.log(`Found ${click_elements.length} elements on page ${current_page}.`);

              for (let i = 0; i<click_elements.length; i++) {
                try {
                  counter++;
                  process.env.AD_CURRENT = (counter).toString();
                  process.env.CURRENT_TIME = moment().format('YYYY-MM-DD HH:mm:ss');

                  const ob_page = await browser.newPage(); 
                  await ob_page.goto(click_elements[i] as string); 

                  await browser.waitForTarget( async target => (await browser.pages())[1] != null)                        
                  console.log(`${i+1}: ${(await browser.pages()).map(e => e.url())}`);

                  if((await browser.pages()).length == 2) {
                    ob_page.setDefaultNavigationTimeout(60000);      
                    if( ob_page.url() != "about:blank" && ob_page.url() != 'chrome-error://chromewebdata/' ) {
                      await ob_page.setViewport({width: 1366, height: 768});
                      await this.parse_page(ob_page);
                    } else {
                      i--;
                    }
                  }

                  await ob_page.close(); 
                  await browser.waitForTarget(async target => (await browser.pages())[1] == null)
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
          console.log(`Deleting no relevance ads...`);
          const del_result = await adMongoModel.deleteMany({ relevance: false, 'ad_data.ad_tag': 'cian' });
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
            await page.goto(page.url());
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
        await page.waitForSelector('div[data-name="Description"]');

        let address_params: any; try { address_params = await page.$eval('div[data-name="Geo"] > span', e => e.getAttribute('content')); } catch { address_params = ''; }
        let building_info: any; try { building_info = await page.$eval('ul[data-name="NewbuildingSpecifications"]', e => e.innerHTML); } catch { building_info = ''; }

        const city_area = (address_params.search(/,\s(р-н\s[^,]*),?/) > -1)?address_params.match(/,\s(р-н\s[^,]*),?/)[1].replace(/(район|р-н)/,'').trim():'';
        let housing_complex_name: string; try { housing_complex_name = await page.$eval('div[data-name="Parent"] > a[data-name="Link"]', e => e.innerHTML.replace(/в\s/,'')); } catch { housing_complex_name = ''; }
        let developer: string; try { developer = await page.$eval('div[data-name="AuthorAsideBrand"] > div > div:nth-child(2) > a > h2', e => e.innerHTML); } catch { developer = ''; }
        const address = (address_params.search(/,\s([^,]*(?:пер\.|ул\.|просп\.)[^,]*,?\s?[^,]*),?/) > -1)?address_params.match(/,\s([^,]*(?:пер\.|ул\.|просп\.)[^,]*,?\s?[^,]*),?/)[1]:'';     
        const housing_class = (building_info.search(/Класс<\/span><\/div><(?:span|a)[^>]*>([^>]*)</) > -1)?building_info.match(/Класс<\/span><\/div><(?:span|a)[^>]*>([^>]*)</)[1]:'';
        const house_material = (building_info.search(/Тип дома<\/span><\/div><(?:span|a)[^>]*>([^>]*)</) > -1)?building_info.match(/Тип дома<\/span><\/div><(?:span|a)[^>]*>([^>]*)</)[1]:'';
        
        await page.waitForSelector('div[data-name="Parent"]');
        let deadline_info: any; try { deadline_info = await page.$eval('div[data-name="Parent"]', e => e.innerHTML); } catch { deadline_info = ''; }
        const deadline = (deadline_info.search(/сдача в (.*)<\/span>/) > -1)?deadline_info.match(/сдача в (.*)<\/span>/)[1]:(deadline_info.search(/сдан в (.*)<\/span>/) > -1)?'Сдан':'';
        
        let list_about: any; try { list_about = await page.$$eval('div[data-testid="object-summary-description-info-block"] > div > div[data-testid="object-summary-description-title"]', el => el.map(e => e.innerHTML)); } catch { list_about = []; }
        const floor = (list_about.indexOf('Этаж') > -1)?(await page.$$eval('div[data-testid="object-summary-description-info-block"] > div > div[data-testid="object-summary-description-value"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Этаж')].replace(/\sиз\s/,'/'):'';
        const total_area = (list_about.indexOf('Общая') > -1)?(await page.$$eval('div[data-testid="object-summary-description-info-block"] > div > div[data-testid="object-summary-description-value"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Общая')].replace(/&nbsp;м²/,'').replace(/,/,'.'):'';
        const living_space = (list_about.indexOf('Жилая') > -1)?(await page.$$eval('div[data-testid="object-summary-description-info-block"] > div > div[data-testid="object-summary-description-value"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Жилая')].replace(/&nbsp;м²/,'').replace(/,/,'.'):'';
        const kitchen_area = (list_about.indexOf('Кухня') > -1)?(await page.$$eval('div[data-testid="object-summary-description-info-block"] > div > div[data-testid="object-summary-description-value"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Кухня')].replace(/&nbsp;м²/,'').replace(/,/,'.'):'';

        const finish_type  = (building_info.search(/Отделка<\/span><\/div><(?:span|a)[^>]*>([^>]*)</) > -1)?building_info.match(/Отделка<\/span><\/div><(?:span|a)[^>]*>([^>]*)</)[1]:'';
        
        let price: any; try { price = await page.$eval('span[itemprop="price"]', e => e.innerHTML.replace(/&nbsp;/g,' ').replace(/(₽|\s)/g,'')); } catch { price = ''; }

        let phone_number: any;  
        try { 
          await page.waitForSelector('div[data-name="DefaultContactsLayout"] > div > button');
          await page.focus('div[data-name="DefaultContactsLayout"]  > div > button');
          await page.click('div[data-name="DefaultContactsLayout"]  > div > button', { button : 'left' });
          await page.waitForSelector('div[data-name="DefaultContactsLayout"]  > div > div > a');
          phone_number = await page.$eval('div[data-name="DefaultContactsLayout"]  > div > div > a', (e: any) => e.getAttribute('href').toString().replace(/tel:\+(.*)/,'$1')); 
        } catch { 
          try {
            await page.waitForSelector('div[data-name="NewbuildingBookedFromDeveloperButton"] > div:nth-child(2) > div > div > button');
            await page.focus('div[data-name="NewbuildingBookedFromDeveloperButton"] > div:nth-child(2) > div > div > button');
            await page.click('div[data-name="NewbuildingBookedFromDeveloperButton"] > div:nth-child(2) > div > div > button', { button : 'left' });
            await page.waitForSelector('div[data-name="NewbuildingBookedFromDeveloperButton"] > div:nth-child(2) > div > div > div > a');
            phone_number = await page.$eval('div[data-name="NewbuildingBookedFromDeveloperButton"] > div:nth-child(2) > div > div > div > a', (e: any) => e.getAttribute('href').toString().replace(/tel:\+(.*)/,'$1')); 
          } catch {
            phone_number = '';
          }
        }          
        const contact = '';        
        let ad_title: string; try { ad_title = await page.$eval('div[data-name="OfferTitle"] > h1', e => e.innerHTML.replace(/&nbsp;/g,' ')); } catch { ad_title = ''; }
        let ad_link: any; try { ad_link = page.url(); } catch { ad_link = ''; }
        let ad_id: string; try { ad_id = (ad_link.search(/^.*\/\d+\/$/) > -1)?ad_link.match(/^.*\/(\d+)\/$/)[1]:''; } catch { ad_id = ''; }

        const number_of_living_rooms = ad_title.replace(/(\d)+\-комн.*/,'$1').replace(/Студия.*/,'Студия');

        const site_date = await page.$eval('div[data-name="OfferAdded"]', e => e.innerHTML);

        const ad_public_time = await this.cian_date_converter(site_date);
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
            ad_tag: 'cian'
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
            const upd_result: any = await adMongoModel.findOneAndUpdate({ '_id':doc_id, 'ad_data.ad_tag':'cian' }, data);

            if(Object.keys(upd_result).length > 0) {    
              res(true);
              console.log(`update result: true`);       
            } else {
              rej(false);
              console.log(upd_result);  
            }
          } catch (e) {
            console.log(e);
            return rej(false);
          }
        }
        res(true);
      } catch {
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

  cian_date_converter(cian_date: string) {
    return new Promise(async (res, rej) => {
      
      cian_date = cian_date.replace(/^(\d{1,2}) янв[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-01-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) фев[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-02-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) мар[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-03-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) апр[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-04-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) мая[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-05-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) июн[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-06-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) июл[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-07-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) авг[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-08-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) сен[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-09-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) окт[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-10-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) ноя[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-11-')}$1 $2`);
      cian_date = cian_date.replace(/^(\d{1,2}) дек[^\d]*(\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-12-')}$1 $2`);
      cian_date = cian_date.replace(/^вчера, (\d{1,2}:\d{1,2})$/,`${moment().subtract(1, "days").format('YYYY-MM-DD')} $1`);
      const result: string = cian_date.replace(/^сегодня, (\d{1,2}:\d{1,2})$/,`${moment().format('YYYY-MM-DD')} $1`);

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
        result = await adMongoModel.exists({ 'ad_data.ad_id': ad_id, 'ad_data.ad_tag': 'cian' }).exec();
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

  calculate_total_ads_count_and_num_of_pages(browser: puppeteer.Browser, req: any) {
    return new Promise(async (res, rej) => {
      console.log(`Calculate pages count...`); 
      let retries = 0;
      while(true) {
        const result = await this.calculate_total_ads_count_and_num_of_pages_(browser, req);
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

  calculate_total_ads_count_and_num_of_pages_(browser: puppeteer.Browser, req: any) { 
    return new Promise(async (res, rej) => {      
      try {
        const page = await browser.newPage();
        await page.goto((await browser.pages())[0].url(), { waitUntil: 'networkidle2' });

        while((await page.$eval('div[data-name="Pagination"] > div > ul > li:last-child > a', e => e.innerHTML)) == '..') {
          await page.waitForSelector('div[data-name="Pagination"] > div > ul > li:last-child > a');
          await page.focus('div[data-name="Pagination"] > div > ul > li:last-child > a');
          await page.click('div[data-name="Pagination"] > div > ul > li:last-child > a', { button : 'left' }); 
          await page.waitForNavigation({ waitUntil: "networkidle2" });
        }
        
        let num_of_pages: number = parseInt(await page.$eval('div[data-name="Pagination"] > div > ul > li:last-child > a', e => e.innerHTML));

        let num_of_pages_flag = false;
        if(req.query.num_of_pages && req.query.num_of_pages > 0 && req.query.num_of_pages < num_of_pages) {
          num_of_pages = req.query.num_of_pages;
          num_of_pages_flag = true;
        }         
  
        console.log(`Found ${num_of_pages} pages.`);
        
        console.log(`Calculate total ads count...`);
        
        await (new Promise(r => setTimeout(r, 1000)));
        await page.waitForSelector('article[data-name="CardComponent"]');
        const current_page_ads_count = (await page.$$eval('article[data-name="CardComponent"]', el => el.map(e => e.getAttribute('href')))).length; 
        
        let last_page_ads_count = 0;

        if(num_of_pages_flag) {
          last_page_ads_count = current_page_ads_count;
        } else {
          await page.waitForSelector('div[data-name="Pagination"] > div > ul > li:last-child');
          await page.focus('div[data-name="Pagination"] > div > ul > li:last-child');
          await page.click('div[data-name="Pagination"] > div > ul > li:last-child', { button : 'left' }); 
          await page.waitForNavigation({ waitUntil: "networkidle2" });
          await this.show_more_press_button(page); 
          last_page_ads_count = (await page.$$eval('article[data-name="CardComponent"]', el => el.map(e => e.getAttribute('href')))).length;
        }

        const total_ads = (num_of_pages-1)*current_page_ads_count+last_page_ads_count;

        console.log(`Total ads: ${total_ads}`); 
        process.env.AD_TOTAL = total_ads.toString();   
        
        await page.close();
        res(num_of_pages);
      } catch {
        rej(false);
      }
    }).then(res=>{return res},rej=>{return rej});
  };

  show_more_press_button(page: puppeteer.Page) { 
    return new Promise(async (res, rej) => {
      let result: any = null;
      try {
        await page.waitForSelector('a[class*="more-button"]');
        while((await page.$eval('a[class*="more-button"]', e => e.innerHTML)) == 'Показать ещё') {              
            await page.focus('a[class*="more-button"]');
            await page.click('a[class*="more-button"]', { button : 'left' }); 
            await page.waitForSelector('a[class*="more-button"]');
        }
        res(true);
      } catch {}

      if(result) {
        res(result);
      } else {        
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