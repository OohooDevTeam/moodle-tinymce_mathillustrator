(function(){tinymce.PluginManager.requireLangPack("mathillustrator");tinymce.create("tinymce.plugins.MathIllustratorPlugin",{init:function(a,b){a.addCommand("mceMathIllustrator",function(){a.windowManager.open({file:b+"/lib/equation.php",width:750,height:520,inline:1,title:'MathIllustrator',popup_css:"../css/style.css"},{plugin_url:b,some_custom_arg:"custom arg"})});a.addButton("mathillustrator",{title:"MathIllustrator",cmd:"mceMathIllustrator",image:b+"/images/math.gif"})},createControl:function(a,b){return null},getInfo:function(){return{longname:"MathIllustrator plugin",author:"Braedan Jongerius",authorurl:"http://www.csj.ualberta.ca",infourl:"",version:"1.0"}}});tinymce.PluginManager.add("mathillustrator",tinymce.plugins.MathIllustratorPlugin)})()