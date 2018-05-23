/*
WES GDPR popup - coooooookie
*/

var wes_cookie = {
    name : "_eu_wes",
    val: 1,
    scriptLink : "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js",
    get: function() {
        var self = this;
        return new Promise(function(resolve, reject){
            $.getScript(self.scriptLink).done(function(js){
                resolve(typeof Cookies.get(self.name) !== "undefined");
            });
        });
    },
    set: function() {
        var self = this;        
        $.getScript(self.scriptLink).done(function(){
            Cookies.set(self.name, self.val, { expires: 1825 });
            return self.get();
        });
        
    },
    toString: function() {
        return this.name + ", " + this.val;
    }
}

var Ip = {
    getInfo : function() {
        var options = $.extend( options || {}, {
            dataType: "jsonp",
            type: "GET",
            url: "https://api.ipstack.com/check",
            data: { access_key : "91470bf648eedda2b1f664aee50db435" }
        });
        return $.ajax(options);
    }
}

class user_consent{
    constructor(options){
        if (typeof options !== "object") this.throwError("Invalid parameter");

        this.mode = "modal";
        this.ScriptsToInject = options.js;        
        this.appendTo = options.el.name;        
        this.site = options.site;
        
        this.checkParams();

        this.modalContentUrl = this.getModalContent();
        this.alertContentUrl = this.getAlertContent();
    }

    init(){
        var self = this;
        wes_cookie.get().then(function(cookieAlreadySet){
            if (cookieAlreadySet) {
                self.injectScripts();
                return;
            }

            try {
                Ip.getInfo().done(function(json){
                    if (!json.location.is_eu) {
                        self.mode = "alert";
                        self.injectScripts();
                    }
                    self.showConsent();
                });
            }
            catch(error){
                console.log("error occured: " + error)

                // continue as if eu
                self.injectScripts();
                self.showConsent();
            }            
        });
    }

    showConsent(){
        var self = this;
        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done(function(text){
                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);                    
                    self.appendTo.prepend(newDiv);

                    $("#okButton").on("click", function(){ 
                        wes_cookie.set().then(function(success){ 
                            if (!success) console.log("cookie not set...");                            
                            $(".newPrivacyAlert").hide('slow'); 
                        });
                    });
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {                    
                    self.appendTo.prepend(modal);
                    $("#savecookie").on('click', function(){
                        wes_cookie.set().then(function(success){
                            if (!success) console.log("cookie not set...");
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
    
    getModalContent(){
        switch (this.site){
            case "wes": return "https://jsgdps.azurewebsites.net/terms.html";
            case "imp": return "";
            case "wenr": return "";
            case "gtb": return "";
            default: return "https://jsgdps.azurewebsites.net/terms.html";
        }
    }

    getModalContent(){
        switch (this.site){
            case "wes": return "https://jsgdps.azurewebsites.net/alertText.html";
            case "imp": return "";
            case "wenr": return "";
            case "gtb": return "";
            default: return "https://jsgdps.azurewebsites.net/alertText.html";
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
        throw msg;
    }
}