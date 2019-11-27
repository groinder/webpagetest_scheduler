const WebPageTest = require('webpagetest');
const axios = require('axios');
const fs = require('fs');
const schedule = require('node-schedule');
const readline = require('readline');

const wpt = new WebPageTest('www.webpagetest.org');

const getPageDataUrl = (id) => `http://www.webpagetest.org/result/${id}/page_data.csv`

const fetchPageData = async (testId, fileName, mobile) => {
    const result = await axios.get(getPageDataUrl(testId));
    let csvString = result.data;
    const file = mobile ? fileName : `mobile_${fileName}`;

    if (fs.existsSync(file) && fs.statSync(file).size > 0) {
        csvString = csvString.split('\n').slice(1).join('\n')
    }
    fs.appendFileSync(file, csvString);
    // console.log(result)
}

const runTest = (page, fileName, mobile, key) => {
    console.log(`Starting ${page} test on ${mobile ? 'mobile' : 'desktop'}`);
    wpt.runTest(page, {
        disableOptimization: true,
        pollResults: 5,
        timeout: 180,
        key,
        location: mobile ? 'Dulles_MotoG4' : 'ec2-eu-west-3'
    }, (err, data) => {
        if (data) {
            fetchPageData(data.data.id, fileName, mobile)
        } else {
            console.log(err)
        }
    });
}

const scheduleTest = (testPages, scheduleString) => {
    schedule.scheduleJob(scheduleString, () => {
        testPages.forEach(([page, fileName, key]) => {
            runTest(page, fileName, false, key)
            runTest(page, fileName, true, key)
        })
    })
}

const pages = [
    ['https://www.x-kom.pl/', 'xkom.csv', 'A.348dbf213a159e5ecbd9cf55357635ba'],
    ['https://allegro.pl/', 'allegro.csv', 'A.348dbf213a159e5ecbd9cf55357635ba'],
    ['https://www.morele.net/', 'morele.csv', 'A.ec02ae740d391c7060f903abf3ff3cc7'],
    ['https://www.amazon.com/', 'amazon.csv', 'A.ec02ae740d391c7060f903abf3ff3cc7']
];

scheduleTest(pages,  '0 * * * *')
