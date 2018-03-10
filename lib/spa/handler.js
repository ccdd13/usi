"use strict";

/* global browser,basic_helper, page_injection_helper, userscript_handle */

class SPA {

    async _create(userscriptId, existingTabId) {
        const background_page = browser.extension.getBackgroundPage();
        const userscript_storage = await background_page.userscript_storage;
        const userscript_init = userscript_storage.getById(userscriptId);

        const spa_userscript_exec_object = await background_page.page_injection_helper.create_spa_userscript_exec_object(userscript_init);

        if (spa_userscript_exec_object === false) {
            console.error(`Error, coudn't create SPA Object (${userscript_init.id})`);
            return false;
        }

        if (existingTabId) {
            const tabId = existingTabId;
            // Mittels Page Injection ausführen
            background_page.page_injection_helper._startTabExecution(tabId, spa_userscript_exec_object);
        } else {
            
            try {
                // neuen Tab öffnen
                let spa_page = browser.tabs.create({
                    url: "/spa.html#" + userscriptId
                });
            } catch (error_tab) {

                if (browser.runtime.lastError) {
                    console.error(browser.runtime.lastError);
                }

                console.error(error_tab);
                basic_helper.notify("Error while creating SPA Page");
                return;
            }
        }
    }

    /**
     * erzeugt einen neuen Tab und führt das SPA aus
     * @param {int} userscriptId 
     */
    async createPage(userscriptId) {
        this._create(userscriptId);
    }

    /**
     * führt das SPA aus in diesem Tab aus
     * @param {int} userscriptId 
     * @param {int} tabId 
     */
    async applyToThisTab(userscriptId, tabId) {
        this._create(userscriptId, tabId);
    }
}

// öffnet einen Port
browser.runtime.onConnect.addListener(function (port) {

    if (port.name !== "spa") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function (message) {
        try {

            switch (message.name) {
                case "applyToThisTab":
                    if(!message.data.id || !message.data.tabId){
                        // keine ID
                        port.postMessage({name: message.name});
                        return;
                    }

                    let spa_instance = new SPA();
                    // exec
                    spa_instance.applyToThisTab(message.data.id, message.data.tabId);
                    
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

});