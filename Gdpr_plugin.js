/*
WES GDPR popup - coooooookie
*/

class Eu_Cookie{    
    constructor(name, val){
        this.name = name;
        this.scriptLink = "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js";
        this.val = val;
    }

    get(){
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(js){
                resolve(typeof Cookies.get(self.name) !== "undefined");
            });
        });
    }
    
    set(){
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(){
                Cookies.set(self.name, self.val, { expires: 1825 });
                resolve();
            });
        });
    }

    toString(){
        return this.name + ", " + this.val;
    }
}

var IpStack = {
    getInfo : () => {        
        var options = $.extend( options || {}, {
            dataType: "jsonp",
            type: "GET",
            url: "http://api.ipstack.com/check",
            data: { access_key : "88de7a4a65b399634e9291d9070aac3f" }
        });
        return $.ajax(options);
    }
}

// if is europe => getLocation()
// then find a cookie
// if no cookie is found
// then show popup - set cookie on save
// if cookie is found then no popup return false; 

class GDPR{
    constructor(options){
        if (typeof options !== "object") this.throwError("Invalid parameter");

        this.mode = "modal";
        this.ScriptsToInject = options.js;
        this.appendTo = options.appendTo;
        this.site = options.site;

        // test
        this.eu = options.isEu;
        
        this.checkParams();

        this.modalContentUrl = this.getPrivacyLink();
        this.alertContentUrl = "https://jsgdps.azurewebsites.net/alertText.html";
	    
    }

    Init(){
        var eucookie = new Eu_Cookie("_eu_wes", 1);
        var self = this;
        eucookie.get().then(function(cookieAlreadySet){
            if (cookieAlreadySet) {
                self.injectScripts();
                return;
            }

            /* enable the code below when to use api - im disabling because I have site deployed on ssl and http call won't work*/

            /*            
            IpStack.getInfo().done(function(json){
                if (!json.location.is_eu) {
                    self.mode = "alert";
                    self.injectScripts();                    
                }

                self.showConsent(eucookie);
            });*/

            /* disable this when enabling the code above */
            // if not eu
            if (!self.eu){
                // change the mode to alert
                self.mode = "alert";
                self.injectScripts();
            }

            self.showConsent(eucookie);            
        });
    }

    showConsent(eucookie){
        var self = this;
        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done(function(text){
                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                    self.appendTo.prepend(newDiv);
                    $("#okButton").on("click", function(){ eucookie.set().then(function(){ $(".newPrivacyAlert").hide('slow'); });});
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {
                    self.appendTo.append(modal);                        
                    $("#savecookie").on('click', function(){
                        eucookie.set().then(function(){
                            $("#myModal").modal('hide');
                            self.injectScripts();
                        });
                    });
                    $("#myModal").modal({backdrop: 'static', keyboard: false});
                });
            case "redirect":
                break;
            default: break;
        }
    }

    getPrivacyLink(){
        switch (this.site){
            case "wes": return "https://jsgdps.azurewebsites.net/terms.html"
            case "imp": return ""
            case "wenr": return ""
            case "gtb": return ""
        }
    }

    injectScripts(){
        this.ScriptsToInject.forEach(script => {
            $.getScript("https://jsgdps.azurewebsites.net/" + script);		
        });
    }

    checkParams(){
        if (!Array.isArray(this.ScriptsToInject)) this.throwError("js must be an array of js scripts.");
        if (this.appendTo instanceof jQuery === false) this.throwError("appendTo must be a jquery selecter object");        
        if (["wes", "gtb", "imp", "wenr"].indexOf(this.site) === -1) this.throwError("Invalid site parameter.");
    }

    throwError(msg){
        console.log(msg);
        return;
    }
}