"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const ImapClient = require("emailjs-imap-client");
const mailparser_1 = require("mailparser");
//skip validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
class Worker {
    constructor(inServerInfo) {
        Worker.serverInfo = inServerInfo;
    }
    connectToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("Connecting to IMAP server...");
            try {
                const client = new ImapClient.default(Worker.serverInfo.imap.host, Worker.serverInfo.imap.port, { auth: Worker.serverInfo.imap.auth });
                client.logLevel = client.LOG_LEVEL_NONE;
                client.onerror = (inError) => {
                    console.log("IMAP.Worker.connectToServer(): Connection error", inError);
                };
                yield client.connect();
                // console.log("Connected to IMAP server successfully.");
                return client;
            }
            catch (inError) {
                console.error("IMAP.Worker.connectToServer(): Exception caught", inError);
                throw inError; // Re-throw the error so the caller is aware that the connection failed
            }
        });
    }
    listMailboxes() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Listing Mailboxes");
            const client = yield this.connectToServer();
            const mailboxes = yield client.listMailboxes();
            yield client.close();
            const finalMailboxes = [];
            //use iteration to add only name and path to finalMailboxes
            const iterateChildren = (inArray) => {
                inArray.forEach((inValue) => {
                    finalMailboxes.push({
                        name: inValue.name, path: inValue.path
                    });
                    iterateChildren(inValue.children);
                });
            };
            iterateChildren(mailboxes.children);
            return finalMailboxes;
        });
    }
    listMessages(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Listing Messages");
            const client = yield this.connectToServer();
            //first select a mailbox
            const mailbox = yield client.selectMailbox(inCallOptions.mailbox);
            if (mailbox.exists === 0) {
                yield client.close();
                return [];
            }
            //retrieve the messages from the first one(1:*) in the mailbox
            const messages = yield client.listMessages(inCallOptions.mailbox, "1:*", ["uid", "envelope"]);
            yield client.close();
            const finalMessages = [];
            messages.forEach((inValue) => {
                finalMessages.push({
                    id: inValue.uid, date: inValue.envelope.date,
                    from: inValue.envelope.from[0].address,
                    subject: inValue.envelope.subject
                });
            });
            return finalMessages;
        });
    }
    //return the message body
    //set return value to string | undefined since parsed.text could be undefined
    getMessageBody(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Returning Message Body");
            const client = yield this.connectToServer();
            //use client.listMessages but specifying need body
            const messages = yield client.listMessages(inCallOptions.mailbox, inCallOptions.id, ["body[]"], { byUid: true });
            const parsed = yield (0, mailparser_1.simpleParser)(messages[0]["body[]"]);
            yield client.close();
            if (parsed.text === undefined) {
                return "undefined";
            }
            else {
                return parsed.text;
            }
        });
    }
    deleteMessage(inCalloptions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Deleting Message with options: ", inCalloptions);
            let client;
            try {
                client = yield this.connectToServer();
                // console.log(`Connected to server, deleting message from mailbox "${inCalloptions.mailbox}" with ID ${inCalloptions.id}`);
                const deleteResult = yield client.deleteMessages(inCalloptions.mailbox, inCalloptions.id, { byUid: true });
                // console.log("Message deleted, result: ", deleteResult);
            }
            catch (error) {
                console.error("An error occurred while deleting the message: ", error);
                throw error; // Re-throw the error to handle it in the calling context if needed
            }
            finally {
                if (client) {
                    try {
                        yield client.close();
                    }
                    catch (closeError) {
                        console.error("An error occurred while closing the IMAP connection: ", closeError);
                    }
                }
            }
        });
    }
}
exports.Worker = Worker;
//# sourceMappingURL=IMAP.js.map