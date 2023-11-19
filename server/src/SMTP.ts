import Mail from "nodemailer/lib/mailer";
import * as nodemailer from "nodemailer";
import {SendMailOptions, SentMessageInfo} from "nodemailer";
import {IServerInfo} from "./ServerInfo";
/*const nodemailer= require("nodemailer");*/


export class Worker{
    private static serverInfo: IServerInfo;
    constructor(inServerInfo: IServerInfo) {
        Worker.serverInfo = inServerInfo;
    }

    public sendMessage(inOptions: SendMailOptions):
        Promise<String>{
        return new Promise((inResolve, inReject) =>{
            console.log("Sending Message");
            const transport: Mail = nodemailer.createTransport(Worker.serverInfo.smtp);
            transport.sendMail(inOptions,
                (inError: Error | null, inInfo: SentMessageInfo) => {
                    if(inError){
                        inReject(inError);
                    }else{
                        //give parameter for inResolve so that the return of Promise will be string
                        inResolve("Message sent successfully!");
                    }
                })
        })
    }
}

