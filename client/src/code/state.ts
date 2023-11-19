import * as Contacts from "./Contacts";
import { config } from "./config";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";


//define an object for BaseLayout, which is the state for all
export function createState(inParentComponent){
    return {
        pleaseWaitVisible: false,
        contacts: [],
        mailboxes: [],
        messages: [],
        currentView: "Welcome",
        currentMailbox: null,
        messageID: null,
        messageDate: null,
        messageForm: null,
        messageTo: null,
        messageSubject: null,
        messageBody: null,
        contactID: null,
        contactName: null,
        contactEmail: null,


        showHidePleaseWait: function (inVisible: boolean): void {
            this.setState({pleaseWaitVisible: inVisible});
        }.bind(inParentComponent),


        showContact: function (inID: string, inName: string, inEmail: string): void {
            console.log("state.showContact()", inID, inName, inEmail);
            this.setState({currentView: "contact", contactID: inID, contactName: inName, contactEmail: inEmail});
        }.bind(inParentComponent),


        showAddContact: function (): void {
            console.log("state.showAddContact()");
            this.setState({currentView: "contactAdd", contactID: null, contactName: "", contactEmail: ""});
        }.bind(inParentComponent),


        showMessage: async function (inMessage: IMAP.IMessage): Promise<void> {
            console.log("state.showMessage()", inMessage);
            // Get the message's body.
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const mb: String = await imapWorker.getMessageBody(inMessage.id, this.state.currentMailbox);
            this.state.showHidePleaseWait(false);

            // Update state.
            this.setState({
                currentView: "message",
                messageID: inMessage.id, messageDate: inMessage.date, messageFrom: inMessage.from,
                messageTo: "", messageSubject: inMessage.subject, messageBody: mb
            });
        }.bind(inParentComponent),


        //compose message, including new(from toolbar), reply(from mailbox list) and contact(from contact list)
        showComposeMessage: function (inType: string): void {
            console.log("state.showComposeMessage()");
            switch (inType) {
                case "new":
                    this.setState({
                        currentView: "compose",
                        messageTo: "", messageSubject: "", messageBody: "",
                        messageFrom: config.userEmail
                    });
                    break;
                case "reply":
                    this.setState({
                        currentView: "compose",
                        messageTo: this.state.messageFrom, messageSubject: `Re: ${this.state.messageSubject}`,
                        messageBody: `\n\n---- Original Message ----\n\n${this.state.messageBody}`, messageFrom: config.userEmail
                    });
                    break;
                case "contact":
                    this.setState({
                        currentView: "compose",
                        messageTo: this.state.contactEmail, messageSubject: "", messageBody: "",
                        messageFrom: config.userEmail
                    });
                    break;
            }
        }.bind(inParentComponent),


        addMailboxToList: function (inMailbox: IMAP.IMailbox): void {
            console.log("state.addMailboxToList()", inMailbox);
            // Copy list.
            const cl: IMAP.IMailbox[] = this.state.mailboxes.slice(0);
            // Add new element.
            cl.push(inMailbox);
            // Update list in state.
            this.setState({mailboxes: cl});
        }.bind(inParentComponent),


        addContactToList: function (inContact: Contacts.IContact): void {
            console.log("state.addContactToList()", inContact);
            // Copy list.
            const cl = this.state.contacts.slice(0);
            // Add new element.
            cl.push({_id: inContact._id, name: inContact.name, email: inContact.email});
            // Update list in state.
            this.setState({contacts: cl});
        }.bind(inParentComponent),


        addMessageToList: function (inMessage: IMAP.IMessage): void {
            console.log("state.addMessageToList()", inMessage);
            // Copy list.
            const cl = this.state.messages.slice(0);
            // Add new element.
            cl.push({id: inMessage.id, date: inMessage.date, from: inMessage.from, subject: inMessage.subject});
            // Update list in state.
            this.setState({messages: cl});
        }.bind(inParentComponent),


        clearMessages: function (): void {
            console.log("state.clearMessages()");
            this.setState({messages: []});
        }.bind(inParentComponent),


        setCurrentMailbox: function (inPath: String): void {
            console.log("state.setCurrentMailbox()", inPath);
            // Update state.
            this.setState({currentView: "welcome", currentMailbox: inPath});
            // Now go get the list of messages for the mailbox.
            this.state.getMessages(inPath);
        }.bind(inParentComponent),



        getMessages: async function (inPath: string): Promise<void> {
            console.log("state.getMessages()");
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const messages: IMAP.IMessage[] = await imapWorker.listMessages(inPath);
            this.state.showHidePleaseWait(false);
            this.state.clearMessages();
            messages.forEach((inMessage: IMAP.IMessage) => {
                this.state.addMessageToList(inMessage);
            });
        }.bind(inParentComponent),



        fieldChangeHandler: function (inEvent: any): void {
            console.log("state.fieldChangeHandler()", inEvent.target.id, inEvent.target.value);
            // Enforce max length for contact name.
            if (inEvent.target.id === "contactName" && inEvent.target.value.length > 16) {
                return;
            }
            this.setState({[inEvent.target.id]: inEvent.target.value});
        }.bind(inParentComponent),



        saveContact: async function (): Promise<void> {
            console.log("state.saveContact()", this.state.contactID, this.state.contactName, this.state.contactEmail);
            // Copy list.
            const cl = this.state.contacts.slice(0);
            // Save to server.
            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contact: Contacts.IContact =
                await contactsWorker.addContact({name: this.state.contactName, email: this.state.contactEmail});
            this.state.showHidePleaseWait(false);
            // Add to list.
            cl.push(contact);
            // Update state.
            this.setState({contacts: cl, contactID: null, contactName: "", contactEmail: ""});
        }.bind(inParentComponent),



        deleteContact: async function (): Promise<void> {
            console.log("state.deleteContact()", this.state.contactID);
            // Delete from server.
            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(this.state.contactID);
            this.state.showHidePleaseWait(false);
            // Remove from list.
            const cl = this.state.contacts.filter((inElement) => inElement._id != this.state.contactID);
            // Update state.
            this.setState({contacts: cl, contactID: null, contactName: "", contactEmail: ""});
        }.bind(inParentComponent),



        updateCurrentContact: async function (): Promise<void> {
            console.log("state.updateCurrentContact()", this.state.contactID);

            const updatedContact: Contacts.IContact = {
                _id: this.state.contactID,
                name: this.state.contactName,
                email: this.state.contactEmail
            };

            // show wait dialog
            this.state.showHidePleaseWait(true);

            // update contact to server
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.updateContact(this.state.contactID, updatedContact);

            // hide wait dialog
            this.state.showHidePleaseWait(false);

            //update contact list
            const updatedContactsList = this.state.contacts.map(contact => {
                if (contact._id === updatedContact._id) {
                    return updatedContact;
                }
                return contact;
            });

            //update state
            this.setState({ contacts: updatedContactsList });
        }.bind(inParentComponent),




        deleteMessage: async function (): Promise<void> {
            console.log("state.deleteMessage()", this.state.messageID);
            // Delete from server.
            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            await imapWorker.deleteMessage(this.state.messageID, this.state.currentMailbox);
            this.state.showHidePleaseWait(false);
            // Remove from list.
            const cl = this.state.messages.filter((inElement) => inElement.id != this.state.messageID);
            // Update state.
            this.setState({messages: cl, currentView: "welcome"});
        }.bind(inParentComponent),


        sendMessage: async function (): Promise<void> {
            console.log("state.sendMessage()", this.state.messageTo, this.state.messageFrom, this.state.messageSubject,
                this.state.messageBody
            );
            // Send the message.
            this.state.showHidePleaseWait(true);
            const smtpWorker: SMTP.Worker = new SMTP.Worker();
            await smtpWorker.sendMessage(this.state.messageTo, this.state.messageFrom, this.state.messageSubject,
                this.state.messageBody
            );
            this.state.showHidePleaseWait(false);
            // Update state.
            this.setState({currentView: "welcome"});
        }.bind(inParentComponent)
    };
}
