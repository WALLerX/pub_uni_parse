import puppeteer, { Puppeteer } from 'puppeteer';
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
    let browser: puppeteer.Browser; 
    return new Promise(async (res, rej) => {
      let retries = 0;
      while(true) {        
        try { 
          process.env.PARSE_STATUS="running";
          process.env.START_TIME = moment().format('YYYY-MM-DD HH:mm:ss');
          process.env.AD_CURRENT = '0';
          process.env.AD_TOTAL = '';
          process.env.CURRENT_TIME = '';

          /*console.log("Get proxy...");
          const proxy: any = await this.get_proxy();
          if(!proxy) {
            await (new Promise(r => setTimeout(r, 5000)));
            throw 'error';
          }
          console.log(`Current proxy: ${proxy[0].Type[0].toLowerCase()}://${proxy[0].Ip}:${proxy[0].Port} ${proxy[0].Location.country}, ${proxy[0].Location.city}`);
          */
          console.log("Launch browser...");
          browser = await puppeteer.launch({
            args: [
              '--no-sandbox', 
              '--user-data-dir=/home/node/app/.config/google-chrome', 
              '--disable-blink-features=AutomationControlled',
       //       '--proxy-server=socks5://45.185.6.35:7497'
       //       `--proxy-server=${proxy[0].Type[0].toLowerCase()}://${proxy[0].Ip}:${proxy[0].Port}`
            ],
            executablePath: '/usr/bin/google-chrome',
            headless: true,
          });
          const [page] = await browser.pages();
          page.setDefaultNavigationTimeout(60000);
          
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0');

          await page.setViewport({width: 1366, height: 768});
          
          page.setCookie (
            { name: 'regionAlert',
              value: '1',
              domain: '.domclick.ru',
              path: '/' },
            { name: 'cookieAlert',
              value: '1',
              domain: '.domclick.ru',
              path: '/' }
          );         

          console.log("Goto page...");
          await page.goto('https://krasnoyarsk.domclick.ru/', { waitUntil: 'networkidle2', timeout:50000 });

          console.log("Goto sorted page...");     
          try {
           // throw 'error';
            await page.waitForSelector('nav[aria-label="Навигация второго уровня"] > div:nth-child(4) > div > div > span');

            console.log("Goto menu...");
            await this.move_mouse_to_element(page,'nav[aria-label="Навигация второго уровня"] > div:nth-child(4) > div > div > span');
            await page.focus('nav[aria-label="Навигация второго уровня"] > div:nth-child(4) > div > div > span');
            await page.click('nav[aria-label="Навигация второго уровня"] > div:nth-child(4) > div > div > span', { button : 'left' });      
            await page.waitForSelector('button[aria-label="Закрыть"]');
            
            console.log("Goto list...");
            await page.focus('div[data-dc-modal="opened"] > div > div:nth-child(3) > div > div:nth-child(4) > a');
            await page.click('div[data-dc-modal="opened"] > div > div:nth-child(3) > div > div:nth-child(4) > a', { button : 'left' });
            await page.waitForSelector('a[data-test="listing-go-to-list"]');

            await page.focus('a[data-test="listing-go-to-list"]');
            await page.click('a[data-test="listing-go-to-list"]', { button : 'left' });
            await page.waitForSelector('input[placeholder="Выберите"]');

            console.log("Sorted list by date..."); 
            await page.focus('input[placeholder="Выберите"]');
            await page.click('input[placeholder="Выберите"]', { button : 'left' });
            await page.waitForSelector('div[id="Dropdown-option-first-new"]',{ timeout: 120000 } );        
          
            await page.focus('div[id="Dropdown-option-first-new"]');
            await page.click('div[id="Dropdown-option-first-new"]', { button : 'left' });
          } catch {
            await page.goto('https://krasnoyarsk.domclick.ru/search?deal_type=sale&category=living&offer_type=layout&from=topline2020&sort=published&sort_dir=desc&offset=0', { waitUntil: 'networkidle2', timeout:50000 });
          }

          let num_of_pages = await this.calculate_total_ads_count_and_num_of_pages(browser, req);

          console.log(`Deleting no relevance ads...`);
          const del_result = await adMongoModel.deleteMany({ relevance: false, 'ad_data.ad_tag': 'domclick' });

          if(!req.query.relevance || req.query.relevance == "false") {
            await adMongoModel.updateMany({ 'ad_data.ad_tag': 'domclick' }, { relevance: false });
          } else if(req.query.relevance == "true") {
            await adMongoModel.updateMany({ 'ad_data.ad_tag': 'domclick' }, { relevance: true });
            console.log(`Relevance: ${req.query.relevance}`); 
          }    
    
          let counter = 0;
          let first_page_elements_count = 0; 
          
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
                  
                  await page.goto(page.url().replace(/^(.*offset=)\d+(.*)$/,`$1${first_page_elements_count*(current_page-1)}$2`), { waitUntil: "networkidle2" });

                  if((current_page % 5 == 0 || current_page == (num_of_pages-1)) && current_page < num_of_pages) {
                    const num_of_pages_new = await this.calculate_total_ads_count_and_num_of_pages(browser, req);
                    num_of_pages = (num_of_pages_new)?num_of_pages_new:num_of_pages;                
                  } 
                } 

                let click_elements = await page.$$eval('a[data-test="product-snippet-property-offer"]', el => el.map(e => e.getAttribute('href'))); 
                console.log(`Found ${click_elements.length} elements on page ${current_page}.`);   
                if (current_page == start_page) {
                  first_page_elements_count = click_elements.length;
                  if(start_page > 1) {
                    await page.goto(page.url().replace(/^(.*offset=)\d+(.*)$/,`$1${first_page_elements_count*(current_page-1)}$2`), { waitUntil: "networkidle2" });
                    click_elements = await page.$$eval('a[data-test="product-snippet-property-offer"]', el => el.map(e => e.getAttribute('href'))); 
                  }
                }  

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
                        await ob_page.setViewport({width: 1366, height: 768});
                        await ob_page.waitForSelector('button');

                        const ob_type = ob_page.url().replace(/.*domclick\.ru\/([^\/]+)\/.*/,'$1');

                        if(ob_type == 'complexes') { //прыгаем по квартирам комплексов
                          
                          let address_params: any; try { address_params = await ob_page.$eval('span[class$="Header_addressTitle"]', e => e.innerHTML); } catch { address_params = ''; }
                          let city_area = (address_params.search(/,\s([^,]*\sрайон),?/) > -1)?address_params.match(/,\s([^,]*\sрайон),?/)[1].replace(/(район|р-н)/,'').trim():'';

                          let count_sub_ads: any; try { count_sub_ads = parseInt(await ob_page.$eval('h3[class="flatSelection_title"]', e => e.innerHTML)); } catch { count_sub_ads = 1; };
                          let count_sub_pages = 1;        
                          if(count_sub_ads > 5) {
                            if(count_sub_ads % 5 == 0 ) {
                              count_sub_pages = parseInt((count_sub_ads / 5).toString());
                            } else {
                              count_sub_pages = parseInt((count_sub_ads / 5).toString()) + 1;
                            }
                          }
                          for(let i_sub=1; i_sub<=count_sub_pages; i_sub++) {
                            try {
                              if(i_sub > 1) {                     
                                const page_num = (count_sub_pages > 1)?(await ob_page.$$eval('div[data-test-id="pagination"] > button', el => el.map(e => e.innerHTML))).indexOf(i_sub.toString())+1:i_sub;
                                await ob_page.focus(`div[data-test-id="pagination"] > button:nth-child(${page_num})`);
                                await ob_page.click(`div[data-test-id="pagination"] > button:nth-child(${page_num})`);
                              }

                              await ob_page.waitForSelector('div[class="flatSelection_cardHeader"]');
                              const sub_ads_elements = await ob_page.$$eval('div[class="flatSelection_cardHeader"]', el => el.map(e => e.innerHTML)); 

                              for(let j_sub=1; j_sub<=sub_ads_elements.length; j_sub++) {
                                try {
                                  await ob_page.waitForSelector('div[class="flatSelection_content"]');
                                  await ob_page.focus(`div[class="flatSelection_content"] > div:nth-child(${j_sub})`);
                                  await (new Promise(r => setTimeout(r, 1000)));
                                  await ob_page.click(`div[class="flatSelection_content"] > div:nth-child(${j_sub})`, { button : 'left' });

                                  //if(j_sub == 5) await ob_page.screenshot({ path: "image.png" });

                                  await ob_page.waitForSelector('div[class="flatSelection_moreInfoButton"] > a');
                                  await ob_page.focus(`div[class="flatSelection_moreInfoButton"] > a`);
                                  await ob_page.click(`div[class="flatSelection_moreInfoButton"] > a`, { button : 'middle' });    

                                  await browser.waitForTarget( async target => (await browser.pages())[2] != null) 

                                  if((await browser.pages()).length == 3) {
                                    const sub_ob_page = (await browser.pages())[2];
                                    sub_ob_page.setDefaultNavigationTimeout(60000); 

                                    if(sub_ob_page.url() != "about:blank" && sub_ob_page.url() != 'chrome-error://chromewebdata/') {                       
                                      await sub_ob_page.setViewport({width: 1366, height: 768});
                                      await sub_ob_page.waitForSelector('button');

                                      console.log(sub_ob_page.url());

                                      await this.parse_page(sub_ob_page,city_area);                     
                                    }
                                    else {
                                      j_sub--;
                                    }
                                    await sub_ob_page.close();
                                    await browser.waitForTarget( async target => (await browser.pages())[2] == null)    
                                  }

                                  await ob_page.focus(`button[aria-label="Закрыть"]`);
                                  await ob_page.click(`button[aria-label="Закрыть"]`, { button : 'left' }); 
                                } catch {
                                  await this.delete_extra_pages(browser,2);
                                }                  
                              }
                            } catch {}
                          } 
                        } //конец прыгаем по квартирам комплексов 
                        else {
                          await this.parse_page(ob_page,'');
                        }
                      } else {
                        i--;
                        counter--;
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
            rej(result);
            throw 'error';
          }
        
          process.env.PARSE_STATUS="stopped";
          break;
        } catch { 
          console.log(`Launch retry ${(retries+1)} of ${parseInt(process.env.NUM_RETRIES as string)*10}`);
          try {
           await browser.close();
           await (new Promise(r => setTimeout(r, 5000)));
          } catch {}
          if (++retries == parseInt(process.env.NUM_RETRIES as string)*10) {            
            console.log(`Parse not complete!`);
            process.env.PARSE_STATUS="stopped";
            break;
          }
        }
      }
    }).then(res=>{return res},err=>{return err});
  };

  parse_page(page: puppeteer.Page, city_area_complex: string) {
    return new Promise(async (res, rej) => {
      let retries = 0;
      while(true) {
        if(await this.parse_page_(page, city_area_complex)) {
          res(true);
          break;
        } else {
          console.log(`Retry ${(retries+1)} of ${process.env.NUM_RETRIES as string}`);          
          if (++retries == parseInt(process.env.NUM_RETRIES as string)) {
            console.log(`Parse "${page.url()}" fail!`);
            rej(false);
            break;
          }
        }
      }      
    }).then(res=>{return res},err=>{return err});
  };

  parse_page_(page: puppeteer.Page, city_area_complex: string) {
    return new Promise(async (res, rej) => {
      await (new Promise(r => setTimeout(r, 5000)));
      try {
        let ad_not_public: any; try { ad_not_public = await page.$eval('p[class="offerStatus_unpublishedText"]', e => e.innerHTML); } catch { ad_not_public = ''; } 
        if(ad_not_public == 'Данное объявление больше не актуально.') {
          res(true);
          console.log(`ad not public: true`); 
        } else {
          const ad_e2e = (page.url().search(/new_flat/) > -1)?false:true;

          let address_params: any; try { address_params = (ad_e2e)?await page.$eval('div[class="main_block__location"] > div > div:nth-child(2) > span', e => e.innerHTML.replace(/(<a[^>]*>|<\/a>|<span[^>]*>|<\/span>|<meta[^>]*>|<\/meta>)/g,'')):await page.$eval('span[class$="Header_addressTitle"]', e => e.innerHTML); } catch { address_params = ''; }
          
          let city_area;
          if(ad_e2e) {
            city_area = (address_params.search(/(Советский|Свердловский|Железнодорожный|Кировский|Ленинский|Октябрьский|Центральный)/) > -1)?address_params.replace(/.*(Советский|Свердловский|Железнодорожный|Кировский|Ленинский|Октябрьский|Центральный).*/,'$1'):city_area_complex;
          } else {
            city_area = (address_params.search(/,\s([^,]*\sрайон),?/) > -1)?address_params.match(/,\s([^,]*\sрайон),?/)[1].replace(/(район|р-н)/,'').trim():city_area_complex;
          }          
          let housing_complex_name: string; try { housing_complex_name = (ad_e2e)?await page.$eval('div[data-e2e-id="flat-complex-info"] > div > a > span', e => e.innerHTML):await page.$eval('.complexAndBuildingReadiness_building > a:nth-child(1)', e => e.innerHTML); } catch { housing_complex_name = ''; }
          let developer: string; try { developer = (ad_e2e)?'':await page.$eval('div[class="shortSummary_developerName"] > button', e => e.innerHTML); } catch { developer = ''; }
          let address = (address_params.search(/,\s([^,]*(?:переулок|улица|проспект)[^,]*,?\s?[^,]*),?/) > -1)?address_params.match(/,\s([^,]*(?:переулок|улица|проспект)[^,]*,?\s?[^,]*),?/)[1]:'';     
          
          const housing_class = '';

          let list_about_house: any; try { list_about_house = (ad_e2e)?await page.$$eval('ul[data-testid="-список"] > li > span:nth-child(1)', el => el.map(e => e.innerHTML.replace(/&nbsp;/g,'').trim())):''; } catch { list_about_house = []; }
          let house_material: string; try { house_material = (ad_e2e)?(list_about_house.indexOf('Материал стен') > -1)?(await page.$$eval('ul[data-testid="-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about_house.indexOf('Материал стен')]:'':await page.$eval('span[data-test-id="wallTypeValue"]', e => e.innerHTML); } catch { house_material = ''; }
          let floors_count: string; try { floors_count = (ad_e2e)?(list_about_house.indexOf('Количество этажей') > -1)?(await page.$$eval('ul[data-testid="-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about_house.indexOf('Количество этажей')]:'':''; } catch { floors_count = ''; }

          let deadline: string; try { 
            deadline = (ad_e2e)?await page.$eval('div[data-e2e-id="flat-complex-info"] > span', e => e.innerHTML):await page.$eval('span[class="complexAndBuildingReadiness_buildingDoneBlock"]', e => e.innerHTML);
            deadline = (deadline.search(/.*сдан.*/) > -1)?(ad_e2e)?await page.$eval('div[data-e2e-id="flat-complex-info"] > span', e => e.innerHTML.replace(/(<span[^>]*>.*<\/span>|<a[^>]*>|<\/a>|<span[^>]*>|<\/span>|<meta[^>]*>|<\/meta>|<div[^>]*>|<\/div>|.*,\s)/g,'')):await page.$eval('span[class="complexAndBuildingReadiness_buildingDoneBlock"] > span', e => e.innerHTML):
            deadline.replace(/(<span[^>]*>.*<\/span><a[^>]*>|<\/a>|<span[^>]*>|<\/span>|<meta[^>]*>|<\/meta>|.*,\s)/g,'').replace(/^.*сдача:\s(.*)$/,'$1').replace(/^.*сдача\sв\s(.*)$/,'$1').replace(/&nbsp;/g,' ');
          } catch { deadline = ''; }
          let price: any; try { price = (ad_e2e)?parseInt(await page.$eval('div[class="main_block__price"] > div > div > span', e => e.innerHTML.replace(/(₽|\s|(?:&nbsp;))/g,'').replace(/(\d)/g,'$1'))):await page.$eval('span[class="shortSummary_barePrice"]', e => e.innerHTML.replace(/(₽|\s)/g,'')); } catch { price = ''; }
          
          let list_about: any; try { list_about = (ad_e2e)?await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(1)', el => el.map(e => e.innerHTML.replace(/&nbsp;/g,''))):await page.$$eval('span[class="sc_flatInfoList_rowLabel"]', el => el.map(e => e.innerHTML.replace(/&nbsp;/g,''))); } catch { list_about = []; }
          let number_of_living_rooms = (ad_e2e)?(list_about.indexOf('Комнат') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Комнат')]:'':(list_about.indexOf('Комнаты') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Комнаты')]:'';
          let floor = (ad_e2e)?(list_about.indexOf('Этаж') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Этаж')]:'':(list_about.indexOf('Этаж') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Этаж')]:'';
          const total_area = (ad_e2e)?(list_about.indexOf('Площадь') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Площадь')].replace(/\sм²/,'').replace(/,/,'.').replace(/<span>([\d\.]+).*/,'$1'):'':(list_about.indexOf('Общая площадь') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Общая площадь')].replace(/\sм²/,'').replace(/,/,'.'):'';
          const living_space = (ad_e2e)?(list_about.indexOf('Жилая') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Жилая')].replace(/\sм²/,'').replace(/,/,'.').replace(/<span>([\d\.]+).*/,'$1'):'':(list_about.indexOf('Жилая площадь') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Жилая площадь')].replace(/\sм²/,'').replace(/,/,'.'):'';
          const kitchen_area = (ad_e2e)?(list_about.indexOf('Кухня') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Кухня')].replace(/\sм²/,'').replace(/,/,'.').replace(/<span>([\d\.]+).*/,'$1'):'':(list_about.indexOf('Площадь кухни') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Площадь кухни')].replace(/\sм²/,'').replace(/,/,'.'):'';
          const finish_type  = (ad_e2e)?(list_about.indexOf('Ремонт') > -1)?(await page.$$eval('ul[data-testid="Квартира-список"] > li > span:nth-child(3)', el => el.map(e => e.innerHTML)))[list_about.indexOf('Ремонт')]:'':(list_about.indexOf('Отделка') > -1)?(await page.$$eval('span[class="sc_flatInfoList_rowValue"]', el => el.map(e => e.innerHTML)))[list_about.indexOf('Отделка')]:'';

          if(floors_count.length > 0 && ad_e2e) {
            if(floor.search(/\//) == -1) {
              floor = floor+"/"+floors_count; 
            }
          }

          let phone_number: any;  
          try { 
            if(ad_e2e) {
              await page.waitForSelector('button[data-e2e-id="agent-show-number"]');
              await page.focus('button[data-e2e-id="agent-show-number"]');
              await page.click('button[data-e2e-id="agent-show-number"]', { button : 'left' });
              await page.waitForSelector('a[data-e2e-id="agent-show-number"]');
              phone_number = await page.$eval('a[data-e2e-id="agent-show-number"]', (e: any) => e.getAttribute('href').toString().replace(/tel:\+(.*)/,'$1').replace(/\s/g,'')); 
            } else {
              await page.waitForSelector('div[class="telephony_replacedPhoneBlockContent"] > div > button');
              await page.focus('div[class="telephony_replacedPhoneBlockContent"] > div > button');
              await page.click('div[class="telephony_replacedPhoneBlockContent"] > div > button', { button : 'left' });
              await page.waitForSelector('div[class="telephony_replacedPhoneBlockContent"] > div > a');
              phone_number = await page.$eval('div[class="telephony_replacedPhoneBlockContent"] > div > a', (e: any) => e.getAttribute('href').toString().replace(/tel:\+(.*)/,'$1')); 
            }
          } catch {  
              phone_number = '';
          }  

          let contact; try { contact = (ad_e2e)?await page.$eval('a[data-e2e-id="agent_card_link"]', e => e.innerHTML.replace(/&nbsp;/g,' ')):''; } catch { contact = ''; }      
          let ad_title: string; try { ad_title = (ad_e2e)?await page.$eval('h1[data-e2e-id="product-card-title"]', e => e.innerHTML.replace(/&nbsp;/g,' ').replace(/^(.*)\s<span.*<\/span>$/,'$1')):await page.$eval('h1[class="offerHeader_title"]', e => e.innerHTML.replace(/&nbsp;/g,' ').replace(/^(.*)\s<span.*<\/span>$/,'$1')); } catch { ad_title = ''; }
          let ad_link: any; try { ad_link = page.url(); } catch { ad_link = ''; }
          let ad_id: string; try { ad_id = (ad_link.search(/^.*_\d+$/) > -1)?ad_link.match(/^.*\_(\d*)$/)[1]:''; } catch { ad_id = ''; }
          
          if(number_of_living_rooms.length == 0) {
            if(ad_title.search(/студия/) > -1) {
              number_of_living_rooms = 'студия';
            } else {
              number_of_living_rooms =  ad_title.replace(/[^\d]*(\d+)-комн.*/,'$1');
            }
          }

          let ad_public_time; 
          try {
            const last_change = await page.$eval('div.priceDynamicsOffer_priceSummary_infoRow:nth-child(1) > div:nth-child(3)', e => e.innerHTML);
            ad_public_time = moment(last_change,'DD.MM.YYYY').format('YYYY-MM-DD HH:mm');   
          } catch {
            ad_public_time = moment().format('YYYY-MM-DD HH:mm');
          }       
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
              ad_tag: 'domclick'
            }
          };

          //console.log(data);
          
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
              const upd_result: any = await adMongoModel.findOneAndUpdate({ '_id':doc_id, 'ad_data.ad_tag':'domclick' }, data);

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
        }
        res(true);
      } catch (e) {
       // console.log(e);
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
        result = await adMongoModel.exists({ 'ad_data.ad_id': ad_id, 'ad_data.ad_tag': 'domclick' }).exec();
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
        const page_current = (await browser.pages())[0];
       // await page.goto(page_current.url(), { waitUntil: "networkidle2" });
       // await page_current.screenshot({ path: "image.png" });
       // console.log('...');
        await page_current.waitForSelector('button[data-test="pagination-last-page"]');
        
        let num_of_pages: number = await page_current.$eval('button[data-test="pagination-last-page"]', e => parseInt(e.innerHTML));
            
        if(req.query.num_of_pages && req.query.num_of_pages > 0 && req.query.num_of_pages < num_of_pages) {
          num_of_pages = req.query.num_of_pages;
        } 
  
        console.log(`Found ${num_of_pages} pages.`);
        
        console.log(`Calculate total ads count...`);  

        const current_page_ads_count = (await page_current.$$eval('div[data-test="product-snippet"]', el => el.map(e => e.getAttribute('href')))).length;        
        
        console.log(`Current page ads count: ${current_page_ads_count}`); 

        await page.goto(page_current.url().replace(/^(.*offset=)\d+(.*)$/,`$1${((num_of_pages-1)*current_page_ads_count)}$2`), { waitUntil: "networkidle2" });
        await page.waitForSelector('div[data-test="product-snippet"]');
        const last_page_ads_count = (await page.$$eval('div[data-test="product-snippet"]', el => el.map(e => e.getAttribute('href')))).length;
       
        const total_ads = (num_of_pages-1)*current_page_ads_count+last_page_ads_count;        

        console.log(`Total ads: ${total_ads}`); 
        process.env.AD_TOTAL = total_ads.toString();   

        res(num_of_pages);
      } catch(e) {
        console.log(e);
        rej(false);
      }
      await page.close();
    }).then(res=>{return res},rej=>{return rej});
  };

  get_proxy() { 
    return new Promise(async (res, rej) => {
      try {        
        const body = {a: 1};
        const response = await fetch(`https://www.proxyscan.io/api/proxy?last_check=3600&ping=100&uptime=60`, { method: 'get' });
        const data = await response.json();
        if(data.length == 0) {
          throw 'error';
        }
        res(data);
      } catch {
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