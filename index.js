const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json())



async function getGigDataFn(proURL) {
    try {
        const url = proURL;
        const { data } = await axios({
            method: "GET",
            url: url,
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "en- GB, en; q = 0.9, en - US; q = 0.8, zh - CN; q = 0.7, zh; q = 0.6",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36 Edg/94.0.992.38"
            }
        })


        let $ = cheerio.load(data)
        const gigQuery = '#perseus-app > div > div:nth-child(2) > div.grid-12 > div.gigs-reviews-panel.col-12-xs.col-7-md.col-8-lg > section > div > div > div'

        const gigContainerData = []

        // Get Categories Data
        $(gigQuery).each((parentIdx, parentElem) => {
            const eachData = {}
            $(parentElem).children().children().children('.text-display-7').children().each(async (childIdx, childElem) => {
                const gigTitle = $(childElem).text()
                const gigURL = await 'https://www.fiverr.com'+$(childElem).attr('href')
                
                    if (gigURL) {
                        eachData[gigTitle] = gigURL
                    }
                    
            })
            gigContainerData.push(eachData)
        })



        // Send Final Data to API
        return gigContainerData

        
    } catch (err) {
        console.log(err)
    }
}


////
async function getTagObjects(proURL) {
    try {
        const url = proURL;
        const { data } = await axios({
            method: "GET",
            url: url,
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "en- GB, en; q = 0.9, en - US; q = 0.8, zh - CN; q = 0.7, zh; q = 0.6",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36 Edg/94.0.992.38"
            }
        })


        let $ = cheerio.load(data)
        const tagsQuery = '#main-wrapper > div.main-content > div.gig_page_perseus > div > div.gig-page > div.main > div.gig-tags-container > ul > li'
        const categoryQuery = '#main-wrapper > div.main-content > div.gig_page_perseus > div > div.gig-page > div.main > div.gig-overview > nav > ul > li'

        const categoryData = []
        const TagData = []

        // Get Categories Data
        $(categoryQuery).not(':first-child').each((parentIdx, parentElem) => {
            const eachData = {}
            $(parentElem).children().first().children().each( (childIdx, childElem) => {
                let keyword = $(childElem).text()
                let categoryURL = 'https://www.fiverr.com'+$(childElem).attr('href')
                    if (keyword) {
                        eachData['keyword'] = keyword
                        eachData['categoryURL'] = categoryURL
                    }
                    
            })
            
            categoryData.push(eachData)
        })

        
        // Get Tags Data
        $(tagsQuery).each((parentIdx, parentElem) => {
          const eachData = {}
          $(parentElem).children().each( (childIdx, childElem) => {
            let keyword = $(childElem).text()
            let keywordQuery = keyword.replace(/ /g, "%20");;
            let KeywordSearchURL = `https://www.fiverr.com/search/gigs?query=${keywordQuery}&source=top-bar&search_in=everywhere&search-autocomplete-original-term=${keywordQuery}`
            if (KeywordSearchURL) {
              eachData['keyword'] = keyword
              eachData['KeywordSearchURL'] = KeywordSearchURL
            }
          })
          TagData.push(eachData)
        })


        // Send Final Data to API
        const allData =  {CategoryData: categoryData, TagData:TagData}
        return allData

        
    } catch (err) {
        console.log(err)
    }
}
////

 async function getGigTagCatFn(info){
    const tillGigTagInfo = {};
    for(const link of info){
        const links = Object.values(link)[0]
        const keys = Object.keys(link)[0]
        const gisData = await getTagObjects(links)
        tillGigTagInfo[keys] = gisData
    }
    return tillGigTagInfo
}

async function isFiverrChoiceFn(searchURL, username){
    const  choiceGigQuery= '.badge-fiverr_choice'
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en- GB, en; q = 0.9, en - US; q = 0.8, zh - CN; q = 0.7, zh; q = 0.6",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36 Edg/94.0.992.38"
  });

  await page.goto(searchURL);

  const content = await page.content();

  const $ = await cheerio.load(content);

let isFiverrChoice = false;

const choiceGigUser = $(choiceGigQuery).parent().parent().children('.seller-info').children().children('.seller-identifiers').children('.seller-name-and-country').children().children().text()

if(choiceGigUser === username){
    isFiverrChoice = true
}



  browser.close();
  return isFiverrChoice
}


async function getFiverrChoiceFn(gigTagCatData, username){
    for(const gigTitle in gigTagCatData){
        for(const source in gigTagCatData[gigTitle]){
          for(let eachTagCat of gigTagCatData[gigTitle][source]){
          const isFiverrChoice = await isFiverrChoiceFn(eachTagCat.categoryURL, username)
          eachTagCat['isFiverrChoice'] = isFiverrChoice
          }
        
        }
        }

        return gigTagCatData
}





const finalize = async (usrnm) =>{
    const username = usrnm  // Only need to provide the username
    const profileURL = `https://www.fiverr.com/${username}`
    const getGigData = await getGigDataFn(`${profileURL}`)
    const getGigTagCat = await getGigTagCatFn(getGigData)
    const getFiverrChoice = await getFiverrChoiceFn(getGigTagCat, username)

    return getFiverrChoice
}



// Send Data to API
app.get('/data', async function (req, res) {
    const username = await req.query.username
    const someData = await finalize(username)

    // res.writeHead(200, {
    //     'Content-Type': 'application/json',
    // });
    res.json(someData);
});

app.get('/', async function (req, res) {
    
    res.send("Got it!");
});








//start your server on port 3001
app.listen(env.process.PORT || 5000, () => {
    console.log('Server Listening on port 3001');
});

