var HTTP = require("../Core/HttpService");

var TouTiao = {
    Test: function (data) {
        HTTP.Get("http://www.toutiao.com/api/pc/feed/?category=news_tech&utm_source=toutiao&widen=1&max_behot_time=0&max_behot_time_tmp=1506570379&tadrequire=true&as=A135E92C7C07EA1&cp=59CC37BECAB15E1", "utf8", function () {
            console.log(data);
        });
    }
}

module.exports = TouTiao;