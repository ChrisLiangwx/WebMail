import exp from "constants";

const ImapClient = require("emailjs-imap-client");
import {ParsedMail} from "mailparser";
import {simpleParser} from "mailparser";
import {IServerInfo} from "./ServerInfo";

export interface ICallOptions{
    mailbox: string,
    id?: number
    //not all functions need an id
}

//used when listing messages and retrieving an individual message
export interface IMessage{
    id: string, date: string,
    from: string,
    subject: string, body?: string
}

export interface IMailbox{
    name: string, path: string
}

//skip validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class Worker{
    private static serverInfo: IServerInfo;
    constructor(inServerInfo: IServerInfo) {
        Worker.serverInfo = inServerInfo;
    }

    private async connectToServer(): Promise<any> {
        // console.log("Connecting to IMAP server...");
        try {
            const client: any = new ImapClient.default(
                Worker.serverInfo.imap.host,
                Worker.serverInfo.imap.port,
                { auth: Worker.serverInfo.imap.auth }
            );
            client.logLevel = client.LOG_LEVEL_NONE;
            client.onerror = (inError: Error) => {
                console.log("IMAP.Worker.connectToServer(): Connection error", inError);
            };
            await client.connect();
            // console.log("Connected to IMAP server successfully.");
            return client;
        } catch (inError) {
            console.error("IMAP.Worker.connectToServer(): Exception caught", inError);
            throw inError; // Re-throw the error so the caller is aware that the connection failed
        }
    }

    public async listMailboxes(): Promise<IMailbox[]>{
        console.log("Listing Mailboxes");
        const client: any = await this.connectToServer();
        const  mailboxes: any = await client.listMailboxes();
        await client.close();
        const finalMailboxes: IMailbox[] = [];
        //use iteration to add only name and path to finalMailboxes
        const iterateChildren: Function = (inArray: any[]): void =>{
            inArray.forEach((inValue: any)=>{
                finalMailboxes.push({
                    name: inValue.name, path: inValue.path
                });
                iterateChildren(inValue.children);
            });
        };
        iterateChildren(mailboxes.children);
        return finalMailboxes;
    }

    public async listMessages(inCallOptions: ICallOptions): Promise<IMessage[]>{
        console.log("Listing Messages");
        const client: any = await  this.connectToServer();
        //first select a mailbox
        const mailbox: any = await client.selectMailbox(inCallOptions.mailbox);
        if(mailbox.exists === 0){
            await client.close();
            return [];
        }
        //retrieve the messages from the first one(1:*) in the mailbox
        const messages: any[] = await client.listMessages(
            inCallOptions.mailbox, "1:*", ["uid", "envelope"]
        );
        await client.close();
        const finalMessages: IMessage[] = [];
        messages.forEach((inValue: any) => {
            finalMessages.push({
                id : inValue.uid, date: inValue.envelope.date,
                from: inValue.envelope.from[0].address,
                subject: inValue.envelope.subject
            });
        });
        return finalMessages;
    }

    //return the message body
    //set return value to string | undefined since parsed.text could be undefined
    public async getMessageBody(inCallOptions: ICallOptions): Promise<string> {
        console.log("Returning Message Body");
        const client: any = await this.connectToServer();
        //use client.listMessages but specifying need body
        const messages: any[] = await client.listMessages(
            inCallOptions.mailbox, inCallOptions.id,
            ["body[]"], {byUid : true}
        );
        const parsed: ParsedMail = await simpleParser(messages[0]["body[]"]);
        await client.close();
        if (parsed.text === undefined){
            return "undefined";
        }else{
            return parsed.text;
        }
    }

    public async deleteMessage(inCalloptions: ICallOptions): Promise<any> {
        console.log("Deleting Message with options: ", inCalloptions);
        let client: any;
        try {
            client = await this.connectToServer();
            // console.log(`Connected to server, deleting message from mailbox "${inCalloptions.mailbox}" with ID ${inCalloptions.id}`);
            const deleteResult = await client.deleteMessages(
                inCalloptions.mailbox, inCalloptions.id, { byUid: true }
            );
            // console.log("Message deleted, result: ", deleteResult);
        } catch (error) {
            console.error("An error occurred while deleting the message: ", error);
            throw error; // Re-throw the error to handle it in the calling context if needed
        } finally {
            if (client) {
                try {
                    await client.close();
                } catch (closeError) {
                    console.error("An error occurred while closing the IMAP connection: ", closeError);
                }
            }
        }
    }


}