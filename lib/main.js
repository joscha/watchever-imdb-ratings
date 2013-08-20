var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

var filme = /.*\.watchever\.de\/filme\/.*/
var serien = /.*\.watchever\.de\/serien\/.*/
 
pageMod.PageMod({
  include: [filme, serien],
  contentScriptFile: [data.url("jquery/jquery-2.0.3.min.js"),
                      data.url("inject/inject.js")],
  contentStyleFile: data.url("inject/inject.css"),
  contentScriptWhen: "ready"
});