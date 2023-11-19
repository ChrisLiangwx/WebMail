import React, { Component } from "react";
import { createState } from "../state";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";

import Toolbar from "./Toolbar";
import MailboxList from "./MailboxList";
import MessageList from "./MessageList";
import ContactList from "./ContactList";
import WelcomeView from "./WelcomeView";
import ContactView from "./ContactView";
import MessageView from "./MessageView";
import {config} from "../config";

class BaseLayout extends React.Component {
    state = createState(this);



    render() {
        return (
            <div className="appContainer">
                {/*pop up dialog box*/}
                <Dialog
                    open={this.state.pleaseWaitVisible}
                    disableBackdropClick={true}
                    disableEscapeKeyDown={true}
                    transitionDuration={0}
                >
                    <DialogTitle style={{ textAlign: "center" }}>
                        Please Wait
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Contacting server...
                        </DialogContentText>
                    </DialogContent>
                </Dialog>
                {/*toolbar at the top, including New Message and New Contact*/}
                <div className="toolbar">
                    <Toolbar state={this.state}/>
                </div>
                {/*list of mail boxes below the toolbar*/}
                <div className="mailboxList">
                    <MailboxList state={this.state}/>
                </div>
                {/*center area to display contents*/}
                <div className="centerArea">
                    <div className="messageList">
                        <MessageList state={this.state}/>
                    </div>
                    <div className="centerViews">
                        {this.state.currentView === "welcome" && <WelcomeView/>}
                        {(this.state.currentView === "message" || this.state.currentView === "compose") && <MessageView state={this.state}/>}
                        {(this.state.currentView === "contact" || this.state.currentView === "contactAdd") && <ContactView state={this.state}/>}
                    </div>
                </div>
                {/*always display contacts at the bottom*/}
                <div className="contactList">
                    <ContactList state={this.state}/>
                </div>

            </div>

        );
    }
}

export default BaseLayout;