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

      let time_remaining_seconds = 100*Math.floor(time_lapsed_seconds_total/percent)-time_lapsed_seconds_total;
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
        });
        const [page] = await browser.pages();
        page.setDefaultNavigationTimeout(60000);

        await page.setViewport({width: 1366, height: 768});
    
        console.log("Goto sorted page...");
        await page.goto(`https://www.sibdom.ru/novostroyki/krasnoyarsk/?sorting=default_name`);
        await page.waitForSelector('div[class="page-container"]');
        
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

        for (let current_page = start_page; current_page <= num_of_pages; current_page++)
        {    
          let retries = 0;        
          while(true) {
            try {               
              if (current_page > start_page) {
                console.log(`Goto sorted page ${current_page}...`);
                await page.goto(`https://www.sibdom.ru/novostroyki/krasnoyarsk/?sorting=default_name&page=${current_page}`);
                await page.waitForSelector('div[class="page-container"]'); 
                
                if((current_page % 5 == 0 || current_page == (num_of_pages-1)) && current_page < num_of_pages) {
                  const num_of_pages_new = await this.calculate_total_ads_count_and_num_of_pages(browser, req);
                  num_of_pages = (num_of_pages_new)?num_of_pages_new:num_of_pages;                
                }   
              } 

              if (current_page == start_page && start_page > 1) {
                await page.goto(`https://www.sibdom.ru/novostroyki/krasnoyarsk/?sorting=default_name&page=${start_page}`);
              }  
              
              await page.waitForSelector('div[class^="catalog-object-list"]');
              const click_elements = await page.$$eval('a[class^="catalog-object"]', el => el.map(e => e.getAttribute('href')));
              const click_elements_inner = await page.$$eval('a[class^="catalog-object"]', el => el.map(e => e.innerHTML)); 
              console.log(`Found ${click_elements.length} elements on page ${current_page}.`);        

              for (let i = 0; i<click_elements.length; i++) {
                try {
                  counter++;
                  process.env.AD_CURRENT = (counter).toString();
                  process.env.CURRENT_TIME = moment().format('YYYY-MM-DD HH:mm:ss');              
                  
                  if(click_elements_inner[i].search(/В продаже/) > -1) {
                    await page.focus('a[href="'+click_elements[i]+'"]');
                    await page.click('a[href="'+click_elements[i]+'"]', { button : 'middle' }); 
                    
                    await browser.waitForTarget( async target => (await browser.pages())[1] != null)
                    console.log(`${i+1}: ${(await browser.pages()).map(e => e.url())}`);

                    if((await browser.pages()).length == 2) {
                      const ob_page = (await browser.pages())[1];
                      ob_page.setDefaultNavigationTimeout(60000);

                      if( ob_page.url() != "about:blank" && ob_page.url() != 'chrome-error://chromewebdata/' ) { 
                        try {             
                          await ob_page.setViewport({width: 1366, height: 768});                  
                          await ob_page.waitForSelector('div[class="card-catalog-items"]');                  
                          //прыгаем по новостройкам
                          let from_developers_count: any; try { from_developers_count = await ob_page.$eval('div[id="org_types_tab"] > ul[role="tablist"]', e => e.innerHTML.replace(/[\s\S]*ЗАСТРОЙЩИКА<[^>]*>[^\d]*(\d+)[\s\S]*/,'$1')); } catch { from_developers_count = ''; }
                          let from_investors_count: any; try { from_investors_count = await ob_page.$eval('div[id="org_types_tab"] > ul[role="tablist"]', e => e.innerHTML.replace(/[\s\S]*ИНВЕСТОРОВ<[^>]*>[^\d]*(\d+)[\s\S]*/,'$1')); } catch { from_investors_count = ''; }

                          from_developers_count = (from_developers_count.length > 0)?parseInt(from_developers_count):0; 
                          from_investors_count = (from_investors_count.length > 0)?parseInt(from_investors_count):0; 

                          if(from_developers_count > 0) {
                            await ob_page.waitForSelector('div[class="row ajax_stickers_list2"]');
                            await ob_page.focus('div[id="org_types_tab"] > ul[role="tablist"] > li[class*="tab_builder"]');
                            await ob_page.click('div[id="org_types_tab"] > ul[role="tablist"] > li[class*="tab_builder"]', { button : 'left' });
                            await ob_page.waitForSelector('div[class="row ajax_stickers_list2"]');

                            await this.show_more_press_button(ob_page);

                            let click_sub_elements = await ob_page.$$eval('span[class^="ajax_stickers_list2-col-more"]', el => el.map(e => e.innerHTML.replace(/[^\d]*(\d+)[^\d]*/,'$1')));
                            let click_sub_elements_href = await ob_page.$$eval('a[class^="ajax_stickers_list2-col-link"]', el => el.map(e => e.getAttribute('href')));

                            for (let sub_i = 0; sub_i<click_sub_elements.length; sub_i++) {
                              try {
                                if(parseInt(click_sub_elements[sub_i]) > 1) {
                                  await ob_page.focus(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`);
                                  await ob_page.click(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`, { button : 'left' });
                                  try {
                                    await ob_page.waitForSelector('div[class="ajax_group_list-col-box"] > div[class="row-wrap"]', { timeout: 5000 });
                                  } catch {
                                    await browser.waitForTarget(async target => (await browser.pages())[2] != null); 
                                    if((await browser.pages()).length == 3) {
                                      click_sub_elements[sub_i] = '1';
                                    }
                                  }
                                } else if(parseInt(click_sub_elements[sub_i]) == 1) {
                                  await ob_page.focus(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`);
                                  await ob_page.click(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`, { button : 'middle' });
                                }

                                if(parseInt(click_sub_elements[sub_i]) > 1) {
                                  await ob_page.waitForSelector('div[class="ajax_group_list-col-box"]');
                                  const click_sub_sub_elements = await ob_page.$$eval('a[class="btn-more"]', el => el.map(e => e.getAttribute('href'))); 

                                  for (let sub_sub_i = 0; sub_sub_i<click_sub_sub_elements.length; sub_sub_i++) {
                                    try {
                                      const sub_ob_page = await browser.newPage();
                                      sub_ob_page.setDefaultNavigationTimeout(60000);
                                      await sub_ob_page.goto(`https://www.sibdom.ru${click_sub_sub_elements[sub_sub_i]}`);
                                      await browser.waitForTarget(async target => (await browser.pages())[2] != null);
                              
                                      if((await browser.pages()).length == 3) {  
                                        if( sub_ob_page.url() != "about:blank" && sub_ob_page.url() != 'chrome-error://chromewebdata/' ) {
                                          console.log(sub_ob_page.url());

                                          await sub_ob_page.waitForSelector('div[class="card-info block-package"]');  
                                          await this.parse_page(sub_ob_page);
                                        } else {
                                          sub_sub_i--;
                                        }

                                        await sub_ob_page.close();
                                        await browser.waitForTarget(async target => (await browser.pages())[2] == null)
                                      }
                                    } catch {
                                      await this.delete_extra_pages(browser,2);
                                    } 
                                  }

                                  await ob_page.waitForSelector('div[class="SiteWindowCloser"]');
                                  await ob_page.focus(`div[class="SiteWindowCloser"]`);
                                  await ob_page.click(`div[class="SiteWindowCloser"]`, { button : 'left' });
                                  
                                } else if(parseInt(click_sub_elements[sub_i]) == 1) {

                                  await browser.waitForTarget(async target => (await browser.pages())[2] != null);
                                  if((await browser.pages()).length == 3) {
                                    const sub_ob_page = (await browser.pages())[2];
                                    sub_ob_page.setDefaultNavigationTimeout(60000);
                              
                                    if( sub_ob_page.url() != "about:blank" && sub_ob_page.url() != 'chrome-error://chromewebdata/' ) {
                                      console.log(sub_ob_page.url());

                                      await this.parse_page(sub_ob_page);
                                    } 

                                    await sub_ob_page.close();
                                    await browser.waitForTarget(async target => (await browser.pages())[2] == null)
                                  }
                                }
                              } catch {
                                await this.delete_extra_pages(browser,2);
                              } 
                            }
                          } 

                          if(from_investors_count > 0) {                        
                            await ob_page.waitForSelector('div[class="row ajax_stickers_list2"]');
                            await ob_page.focus('div[id="org_types_tab"] > ul[role="tablist"] > li[class*="tab_investor"]');
                            await ob_page.click('div[id="org_types_tab"] > ul[role="tablist"] > li[class*="tab_investor"]', { button : 'left' });
                            await ob_page.waitForSelector('div[class="row ajax_stickers_list2"]');
                            await this.show_more_press_button(ob_page);

                            let click_sub_elements = await ob_page.$$eval('span[class^="ajax_stickers_list2-col-more"]', el => el.map(e => e.innerHTML.replace(/[\s\S]*(\d+)[\s\S]*/,'$1')));
                            let click_sub_elements_href = await ob_page.$$eval('a[class^="ajax_stickers_list2-col-link"]', el => el.map(e => e.getAttribute('href')));

                            for (let sub_i = 0; sub_i<click_sub_elements.length; sub_i++) {
                              try {
                                if(parseInt(click_sub_elements[sub_i]) > 1) {
                                  await ob_page.focus(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`);
                                  await ob_page.click(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`, { button : 'left' });
                                  try {
                                    await ob_page.waitForSelector('div[class="ajax_group_list-col-box"]', {timeout: 10000});
                                  } catch {
                                    await browser.waitForTarget(async target => (await browser.pages())[2] != null); 
                                    if((await browser.pages()).length == 3) {
                                      click_sub_elements[sub_i] = '1';
                                    }
                                  }
                                } else if(parseInt(click_sub_elements[sub_i]) == 1) {
                                  await ob_page.focus(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`);
                                  await ob_page.click(`a[href="${click_sub_elements_href[sub_i]}"][class^="ajax_stickers_list2-col-link"]`, { button : 'middle' });
                                }

                                if(parseInt(click_sub_elements[sub_i]) > 1) {
                                  await ob_page.waitForSelector('div[class="ajax_group_list-col-box"]');
                                  const click_sub_sub_elements = await ob_page.$$eval('a[class="btn-more"]', el => el.map(e => e.getAttribute('href'))); 

                                  for (let sub_sub_i = 0; sub_sub_i<click_sub_sub_elements.length; sub_sub_i++) {
                                    try {
                                      const sub_ob_page = await browser.newPage();
                                      sub_ob_page.setDefaultNavigationTimeout(60000);
                                      await sub_ob_page.goto(`https://www.sibdom.ru${click_sub_sub_elements[sub_sub_i]}`);
                                      await browser.waitForTarget(async target => (await browser.pages())[2] != null);                         

                                      if((await browser.pages()).length == 3) { 
                                        if( sub_ob_page.url() != "about:blank" && sub_ob_page.url() != 'chrome-error://chromewebdata/' ) {
                                          console.log(sub_ob_page.url());

                                          await sub_ob_page.waitForSelector('div[class="card-info block-package"]');  
                                          await this.parse_page(sub_ob_page);
                                        } else {
                                          sub_sub_i--;
                                        }

                                        await sub_ob_page.close();
                                        await browser.waitForTarget(async target => (await browser.pages())[2] == null)
                                      }
                                    } catch {
                                      await this.delete_extra_pages(browser,2);
                                    } 
                                  }

                                  await ob_page.waitForSelector('div[class="SiteWindowCloser"]');
                                  await ob_page.focus(`div[class="SiteWindowCloser"]`);
                                  await ob_page.click(`div[class="SiteWindowCloser"]`, { button : 'left' });
                                  
                                } else if(parseInt(click_sub_elements[sub_i]) == 1) {

                                  await browser.waitForTarget(async target => (await browser.pages())[2] != null);
                                  if((await browser.pages()).length == 3) {
                                    const sub_ob_page = (await browser.pages())[2];
                                    sub_ob_page.setDefaultNavigationTimeout(60000);
                              
                                    if( sub_ob_page.url() != "about:blank" && sub_ob_page.url() != 'chrome-error://chromewebdata/' ) {
                                      console.log(sub_ob_page.url());

                                      await this.parse_page(sub_ob_page);
                                    } 

                                    await sub_ob_page.close();
                                    await browser.waitForTarget(async target => (await browser.pages())[2] == null)
                                  }
                                }
                              } catch {
                                await this.delete_extra_pages(browser,2);
                              } 
                            }
                          } 
                          //конц прыгаем по новостройкам
                        } catch (e){console.log(e)}
                      } else {
                        i--;
                      }
                      
                      await ob_page.close(); 
                      await browser.waitForTarget(async target => (await browser.pages())[1] == null)
                    }
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
          console.log(`Deleting no relevance ads...`);
          const del_result = await adMongoModel.deleteMany({ relevance: false, 'ad_data.ad_tag': 'sibdom' });
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
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
          } catch {}
          if (++retries == parseInt(process.env.NUM_RETRIES as string)) {
            console.log(`Parse "${page.url()}" fail!`);
            rej(false);
            break;
          }
        }
      }    
      res(true);
    }).then(res=>{return res},err=>{return err});
  };

  parse_page_(page: puppeteer.Page) {
    return new Promise(async (res, rej) => {
      try {        
        await page.waitForSelector('div[class="card-info block-package"]');

        let list_about: any; try { list_about = await page.$$eval('div[class="card-info-name"] > span', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1'))); } catch { list_about = []; }
        
        const city_area = (list_about.indexOf('Город, район') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/<.*>(.*)<\/a>.*/,'$1').replace(/^\s*(\S.*\S)\s*$/,'$1').replace(/^.*,\s(.*)$/,'$1'))))[list_about.indexOf('Город, район')]:'';
        const housing_complex_name = (list_about.indexOf('Новостройка') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/<.*>(.*)<\/a>.*/,'$1').replace(/^\s*(\S.*\S)\s*$/,'$1'))))[list_about.indexOf('Новостройка')]:'';
        const developer = (list_about.indexOf('Застройщик') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/<.*>(.*)<\/a>.*/,'$1').replace(/^\s*(\S.*\S)\s*$/,'$1'))))[list_about.indexOf('Застройщик')]:'';
        const address = (list_about.indexOf('Адрес') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1'))))[list_about.indexOf('Адрес')]:'';
        const housing_class = '';
        const house_material = (list_about.indexOf('Тип дома') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1'))))[list_about.indexOf('Тип дома')]:'';
        const finish_type = (list_about.indexOf('Ремонт/отделка') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1'))))[list_about.indexOf('Ремонт/отделка')]:'';
        const deadline = (list_about.indexOf('Срок сдачи') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1').replace(/<br>/,', '))))[list_about.indexOf('Срок сдачи')]:'';
        const floor = (list_about.indexOf('Этаж / всего этажей') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/[\n\s]/g,''))))[list_about.indexOf('Этаж / всего этажей')]:'';
        const total_area = (list_about.indexOf('Общая площадь') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1').replace(/м²/,'').replace(/[^\d\.]/g,''))))[list_about.indexOf('Общая площадь')]:'';
        const living_space = (list_about.indexOf('Жилая площадь') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1').replace(/м²/,'').replace(/[^\d\.]/g,''))))[list_about.indexOf('Жилая площадь')]:'';
        const kitchen_area = (list_about.indexOf('Площадь кухни') > -1)?(await page.$$eval('div[class="card-info-content"]', el => el.map(e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1').replace(/м²/,'').replace(/[^\d\.]/g,''))))[list_about.indexOf('Площадь кухни')]:'';
        
        let contact: string; try { contact = await page.$eval('div[class="card-feedback-contacts"] > a', e => e.innerHTML.replace(/^\s*(\S.*\S)\s*<span[\.\n\S\s]*$/gm,'$1').replace(/^\s*(\S.*\S)\s*$/,'$1').trim()); } catch { contact = ''; } 
        let price: any; try { price = await page.$eval('[class="card-banner-price--full"]', e => e.innerHTML.replace(/&nbsp;/g,' ').replace(/(₽|\s)/g,'')); } catch { price = ''; }

        await page.waitForSelector('div[class="card-feedback-phone"] > span');
        await page.focus('div[class="card-feedback-phone"] > span');
        await page.click('div[class="card-feedback-phone"] > span', { button : 'left' });
        await page.waitForSelector('div[class="card-feedback-phone"] > span > a');

        let phone_number: any;  
        try { 
          phone_number = await page.$eval('div[class="card-feedback-phone"] > span > a', (e: any) => e.getAttribute('href').toString().replace(/[^\d]/g,'').replace(/tel:8/,'7').replace(/tel:\+(.*)/,'$1').replace(/^(\d+).*$/,'$1').replace(/^8/,'7')); 
          if(phone_number.length > 11) phone_number = phone_number.replace(/^.*(\d{10})$/,"7$1");
          if(phone_number.length == 8) phone_number = phone_number.replace(/^7(\d+)$/,"7391$1");          
        } catch { 
          phone_number = '';
        }          
              
        let ad_title: string; try { ad_title = await page.$eval('div[class="card-title"] > h1', e => e.innerHTML.replace(/^\s*(\S.*\S)\s*$/,'$1')); } catch { ad_title = ''; }
        let ad_link: any; try { ad_link = page.url(); } catch { ad_link = ''; }
        let ad_id: string; try { ad_id = (ad_link.search(/^.*\/\d+\/$/) > -1)?ad_link.match(/^.*\/(\d+)\/$/)[1]:''; } catch { ad_id = ''; }

        const number_of_living_rooms = ad_title.replace(/[^\d]*(\d)+\-комн.*/,'$1').replace(/.*студию.*/,'Студия');

        const site_date = await page.$eval('div[class="card-subtitle"]', e => e.innerHTML.replace(/^.*(?:обновлено|добавлено)\s(\d{2}\.\d{2}\.\d{4}).*$/gm,'$1'));
  
        const ad_public_time = moment(site_date,'DD.MM.YYYY').format('YYYY-MM-DD HH:mm');
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
            ad_tag: 'sibdom'
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
            const upd_result: any = await adMongoModel.findOneAndUpdate({ '_id':doc_id, 'ad_data.ad_tag':'sibdom' }, data);

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

  ad_exist(ad_id: string) { 
    return new Promise(async (res, rej) => {
      let result: any;

      try {
        result = await adMongoModel.exists({ 'ad_data.ad_id': ad_id, 'ad_data.ad_tag': 'sibdom' }).exec();
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

  calculate_total_ads_count_and_num_of_pages(browser: puppeteer.Browser, req: any){
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
      const page = await browser.newPage();     
      try {        
        await page.goto((await browser.pages())[0].url(), { waitUntil: 'networkidle2' });

        let click_pages = await page.$$eval('a[class="page-pagination-link"]', el => el.map(e => e.innerHTML));
        click_pages = click_pages.join(';').replace(/^(.*);$/,'$1').replace(/^;(.*)$/,'$1').split(';');
        let num_of_pages: number = (click_pages.length > 0)?parseInt(click_pages[click_pages.length-1]):1;
  
        if(req.query.num_of_pages && req.query.num_of_pages > 0 && req.query.num_of_pages < num_of_pages) {
          num_of_pages = req.query.num_of_pages;
        } 
  
        console.log(`Found ${num_of_pages} pages.`);
        
        console.log(`Calculate total ads count...`);

        await page.goto(`https://www.sibdom.ru/novostroyki/krasnoyarsk/?sorting=default_name`);
        await page.waitForSelector('div[class^="catalog-object-list"]');
        const first_page_ads_count = (await page.$$eval('a[class^="catalog-object"]', el => el.map(e => e.getAttribute('href')))).length; 

        await page.goto(`https://www.sibdom.ru/novostroyki/krasnoyarsk/?sorting=default_name&page=${num_of_pages}`);
        await page.waitForSelector('div[class^="catalog-object-list"]');
        const last_page_ads_count = (await page.$$eval('a[class^="catalog-object"]', el => el.map(e => e.getAttribute('href')))).length; 
        const total_ads = (num_of_pages-1)*first_page_ads_count+last_page_ads_count;
        
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

  show_more_press_button(page: puppeteer.Page) { 
    return new Promise(async (res, rej) => {
      let result: any = null;
      try {
        await page.waitForSelector('div[class="b-column__full b-stickers-ajax-list__more section-link-all"] > a');
        while(await page.$('div[class="b-column__full b-stickers-ajax-list__more section-link-all"] > a')) {              
            await page.focus('div[class="b-column__full b-stickers-ajax-list__more section-link-all"] > a');
            await page.click('div[class="b-column__full b-stickers-ajax-list__more section-link-all"] > a', { button : 'left' }); 
            await page.waitForSelector('div[class="b-column__full b-stickers-ajax-list__more section-link-all"] > a');
            await (new Promise(r => setTimeout(r, 500)));
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