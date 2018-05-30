/*
WES GDPR consent popup.
*/

class wes_cookie{
    constructor(name, domain){
        this.name = name;
        this.val = 1;
        this.exp = 1825;
        this.domain = domain;
        this.scriptLink = "https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js";
    }

    get(){
        return new Promise((resolve, reject) => {            
            $.getScript(this.scriptLink).done((js) => {
                resolve(typeof Cookies.get(this.name) !== "undefined");
            });
        });
    }    

    set(){        
        return new Promise((resolve, reject) => {
            $.getScript(this.scriptLink).done(() => {
                Cookies.set(this.name, this.val, { 
                    expires: this.exp, 
                    domain: this.domain 
                });
                resolve(true);
            });
        });
    }

    toString(){
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
        this.cookieDomain = this.getDomain();

        this.cookie_eu = new wes_cookie("_eu_wes", this.cookieDomain);
        this.cookie_ip = new wes_cookie("_eu_ip", this.cookieDomain);
        
        this.checkParams();

        this.modalContentUrl = this.getModalContent();
        this.alertContentUrl = this.getAlertContent();
    }

    init(){
        this.cookie_eu.get().then((consentCookieSet) => {            
            if (consentCookieSet) {
                this.injectScripts();
                return;
            }           

            this.isEu().then((isEu) => {
                if (isEu){
                    this.showConsent();
                    return;
                }
                
                this.mode = "alert";
                this.injectScripts();
                this.showConsent();                    
            })
        });
    }

    isEu(){
        return new Promise((resolve, reject) => {
            // first check if cookie is set for eu customer
            // val 0 => non eu | val 1 => eu
            this.cookie_ip.get().then((cookieSet) => {
                if (!cookieSet){                    
                    Ip.getInfo()
                        .done((json) => {
                            if (!json.location.is_eu) this.cookie_ip.set().then(resolve(false));
                            else resolve(true);
                        })
                        .fail((error) => resolve(false));
                }
                else resolve(false);
            });
        });
    }
    
    showConsent(){        
        switch(this.mode){
            case "alert":
                $.get(this.alertContentUrl).done((text)=>{
                    var newDiv = $('<div/>').addClass("alert alert-info newPrivacyAlert").attr("role","alert").append(text);
                    this.appendTo.prepend(newDiv);
                    this.setButtons();
                });
                break;
            case "modal":
                $.get(this.modalContentUrl).done((modal) => {
                    this.appendTo.prepend(modal); 
                    $("#myModal").modal({backdrop: 'static', keyboard: false});
                    this.setButtons();
                });
            case "redirect":
                break;
            default: break;
        }
    }

    setButtons(){        
        var path = "https://www.wes.org/";
        if (window.location.href.indexOf("/ca/") !== -1){
            path += "ca/";
        }

        $("#pp").attr("href", path + "privacy-policy/");
        $("#cc").attr("href", path + "cookie-policy/");

        $("#btnIAccept").on("click", () => { 
            this.cookie_eu.set(null).then(() => {
                if (this.mode === "alert"){
                    $(".newPrivacyAlert").hide('slow'); 
                }
                else{
                    $("#myModal").modal('hide');
                    this.injectScripts();
                }                
            });
        });
    }

    getDomain(){
        var domain = window.location.hostname;
        return domain.substring(domain.indexOf('.'), domain.indexOf('.org') + 4);
    }
    
    getModalContent(){
        return "https://" + window.location.hostname + "/terms.html";
    }

    getAlertContent(){        
        return "https://" + window.location.hostname + "/alertText.html";
    }    

    injectScripts(){        
        this.ScriptsToInject.forEach(script => {
            $.getScript("https://applications.wes.org/js/" + script);		
        });
    }

    checkParams(){
        if (!Array.isArray(this.ScriptsToInject)) this.throwError("js must be an array of js scripts.");
        if (this.appendTo instanceof jQuery === false) this.throwError("appendTo must be a jquery selecter object");        
    }

    throwError(msg){
        throw msg;
    }
}