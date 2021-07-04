const request = require('request');

const homepage = async (req, res) => {
    var options = {
        'method': 'GET',
        'url': 'https://www.goldapi.io/api/XAU/INR',
        'headers': {
            'x-access-token': process.env.X_ACCESS_TOKEN,
            'Content-Type': 'application/json'
        }
    };
    await request(options, async function (error, response) {
        if (error) throw new Error(error);
        const convert = JSON.parse(JSON.stringify(response.body))
        const convert2 = JSON.parse(convert);

        res.render('homepage', {
            data: convert2
        })
    });
}

module.exports = homepage;