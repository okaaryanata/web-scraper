var cheerio = require("cheerio");
var rp = require("request-promise");
var fs = require("fs");

var mainURL = "https://www.bankmega.com";

var options = {
  uri: "https://www.bankmega.com/promolainnya.php",
  transform: function(body) {
    return cheerio.load(body);
  }
};

var optionsGetItems = {
  uri: "https://www.bankmega.com/promolainnya.php",
  transform: function(body) {
    return cheerio.load(body);
  }
};

var optionsGetItemDetail = {
  uri: "",
  transform: function(body) {
    return cheerio.load(body);
  }
};

var $ = rp(options)
  .then(function($) {
    //   Get category
    var arrCategory = [];
    var finalResponse = {};
    console.log("Success load URL");
    var data = $("#subcatpromo").children();
    data.each((index, value) => {
      var category = $(value).children();
      var obj = new Object();
      obj.title = category.attr("title");
      obj.id = category.attr("id");
      arrCategory.push(obj);
      finalResponse[String(obj.title)] = [];
    });

    // get item for each category
    arrCategory.forEach((element, index) => {
      var pageSize = 0;
      var newurl = options.uri;
      var arrItemPerCat = [];
      newurl = options.uri + "?product=0&subcat=" + (index + 1).toString();
      optionsGetItems.uri = newurl;
      rp(optionsGetItems)
        .then(function($) {
          var findPage = $(".tablepaging tbody tr td")
            .eq(1)
            .children()
            .attr("title");
          if (findPage !== undefined) {
            findPage = parseInt(findPage.replace("Page 1 of ", ""));
            pageSize = findPage;
            element["pageSize"] = pageSize;
          } else {
            element["pageSize"] = pageSize;
          }
        })
        .then(() => {
          if (pageSize != 0) {
            for (var x = 1; x < pageSize + 1; x++) {
              var newUrlPage = newurl + "&subcat=" + x;
              optionsGetItems.uri = newUrlPage;
              rp(optionsGetItems).then(function($) {
                var allItems = $("#promolain").children();
                allItems.each((index, value) => {
                  process.stdout.write(`.`);
                  var a = $(value).children();
                  var link = a.attr("href");
                  if (!link.includes(mainURL)) {
                    link = mainURL + "/" + link;
                  }
                  var title = a.children().attr("title");
                  var imageUrl = a.children().attr("src");
                  if (!imageUrl.includes(mainURL)) {
                    imageUrl = mainURL + "/" + imageUrl;
                  }

                  optionsGetItemDetail.uri = link;
                  var itemArea = "";
                  var itemPeriod = "";
                  var itemKeteranganImage = "";
                  rp(optionsGetItemDetail)
                    .then(function($) {
                      itemArea = $(".area")
                        .children()
                        .text();
                      itemPeriod = $(".periode")
                        .children()
                        .text();
                      itemKeteranganImage = $(".keteranganinside")
                        .find("img")
                        .attr("src");
                      if (
                        itemKeteranganImage !== undefined &&
                        !itemKeteranganImage.includes(mainURL)
                      ) {
                        itemKeteranganImage = mainURL + itemKeteranganImage;
                      }
                    })
                    .then(() => {
                      var obj = new Object();
                      obj.link = link;
                      obj.title = title;
                      obj.image_url = imageUrl;
                      obj.area = itemArea;
                      obj.period = itemPeriod;
                      obj.keterangan = itemKeteranganImage;

                      finalResponse[element.title].push(obj);
                      createFile(finalResponse);
                    });
                });
              });
            }
          }
        });
    });
    process.stdout.write("writing file ");
  })
  .catch(function(err) {
    console.log("failed load url");
  });

// function to create file
function createFile(finalResponse) {
  fs.writeFile("solution.json", JSON.stringify(finalResponse), function(err) {
    if (err) {
      console.log(err);
    } else {
      console.clear();
      console.log("Success create solution.json");
    }
  });
}
