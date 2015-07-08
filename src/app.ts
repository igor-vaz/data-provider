import Factory        = require("./common/factory");
import Logger         = require("./common/logger");
import Config   	  = require("./config");
import IService       = require("./service/iService");
import Strings        = require("./strings");
import MailServer     = require("./core/mail/mailServer");
import MailObject     = require("./core/mail/mailObject");
import Utils          = require("./common/tools/utils");
import $inject        = require("./core/inject");

/**
 * Main application process.
 * @class App
 */
class Application{

    /**
     * Init application
     *
     * @method main
     * @param {String[]} argv Process arg list
     * @return {void}
     */
    public static main(argv: string[]): void {
        "use strict";
        Application.handleFatalError();
        
        var logger: Logger = Factory.getServerLogger();
        logger.info(Strings.provider.rest.start);
        
        var service: IService = $inject("service/serverService");
        service.retrieve();
        
        Application.schedule( ()=>{
            service.retrieve();
        }, Config.environment.provider.updateInterval);   
    }
    
    public static schedule(callback: ()=>void, updateInterval: number): void {
        setTimeout(()=>{
            callback();
            Application.schedule(callback, updateInterval);
        }, updateInterval);
    }
    
    public static handleFatalError(): void {
        process.on('uncaughtException', (error: any) => {
            
            var msgConfig: any = Config.errorMailMessage;
            var mail: MailObject = new MailObject();
            mail.setFromAddress(msgConfig.from);
            mail.setToAddress(msgConfig.to);
            mail.setSubject(msgConfig.subject);
            mail.setMessage(Utils.replacePattern(/\$\$/, error.stack, msgConfig.text));
            
            var mailServer: MailServer = new MailServer();
            mailServer.sendMail(mail, (error, message) =>{
                if(error) console.log(error);
                if(message) console.log(message);
                process.exit(-1);
            });
        });
    }
}

export = Application;