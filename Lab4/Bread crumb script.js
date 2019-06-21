//Bread crumb script - Kevin Lynn Brown
//Duplicate directory names bug fix by JavaScriptKit.com
//Visit JavaScript Kit (http://javascriptkit.com) for script

var path = "";
var href = document.location.href;
var s = href.split("/");

for (var i=2;i<=(s.length-1);i++) {
	if (i==2) { 
		path+="<A HREF=\""+href.substring(0,href.indexOf("/"+s[i])+s[i].length+1)+"/\">"+s[i];
		continue;
	}

	if (i==s.length-1) {
	path+="<A HREF=\""+href.substring(0,href.indexOf("/"+s[i])+s[i].length+1)+"/\">"+s[i];
		continue;
	} 
	
		path+="<A HREF=\""+href.substring(0,href.indexOf("/"+s[i])+s[i].length+1)+"/\">"+s[i]+"</A> / ";
	}

document.writeln(path);

