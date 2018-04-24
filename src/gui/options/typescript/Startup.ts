declare var jQuery: any;

import event_controller from "events/event_controller";

import language_replace_in_DOM from "Language";
import config_storage from "lib/storage/config";

import Vue from "vue";

import OverviewComponent from "Components/Overview.vue";
import EditComponent from "Components/Edit.vue";
import LoadExternalComponent from "Components/LoadExternal.vue";
import ConfigComponent from "Components/Config.vue";
import ListComponent from "Components/List.vue";
import HelpComponent from "Components/Help.vue";

/**
 * Zunächst die Konfiguration laden
 */
config_storage().get().then((config: usi.Storage.Config) => {

    const class_names_for_sidebar = "sidebar-left-visible sidebar-left-in";
    // Versionslabel auslesen
    const manifest = <any>browser.runtime.getManifest();

    // AppBody Vue Instance - Verwaltet die einzelnen Components
    const AppBody = new Vue({
        el: "#gui"
        , data: {
            version: manifest.version
            , navTitle: "Overview"
            , menuEntries: [
                { name: "overview", lang: "overview" },
                { name: "list", lang: "all_userscripts" },
                { name: "edit", lang: "create_new_userscript" },
                { name: "loadExternal", lang: "userscript_after_load" },
                { name: "config", lang: "loadOptions_title" },
                /* { name: "help", lang: "help" } */
            ]
            // legt fest, welcher Component momentan aktiv ist
            , activeComponent: "overview"
            , extraData: {}
            , configuration: config
        }
        , created: function () {

            // initialisiere die globalen Events für die Kommunikation mit dem Backend
            event_controller().register_global_events();

            // Eigenes CSS
            if (this.configuration.own_css.length > 0) {
                // CSS aktivieren
                this.change_css(this.configuration.own_css);
            }

            // initial die overview Komponente laden
            this.hide_side_menu_and_load(0);
        }
        , methods: {
            change_css : function(cssContent: string){
                let css_text = cssContent.replace(/<\/?[^>]+>/gi, '');
                // CSS aktivieren
                jQuery("#usiAdditionalCss").text(css_text);
            },
            hide_side_menu_and_load: function (index: number) {
                // Aktuelle Komponente suchen
                const menu_entry = this.menuEntries[index];
                if (!menu_entry) {
                    throw "component nicht gefunden in data.menuEntries";
                }

                this.change_active_component(menu_entry);
            }

            , change_active_component: function (menuEntry: { name: string, lang: string }) {
                // @todo
                jQuery("body").removeClass(class_names_for_sidebar);

                // ersetze die Überschrift
                this.navTitle = browser.i18n.getMessage(menuEntry.lang);

                // Aktive Komponente umschalten
                this.activeComponent = menuEntry.name;

                this.replace_language_attributes();
            }

            , replace_language_attributes: function () {
                Vue.nextTick()
                    .then(function () {
                        /**
                         * nachdem die create() ausgeführt wurde,
                         * müssen noch die Attribute data-usi-lang ersetzt werden
                         */
                        language_replace_in_DOM();
                    });
            }

            // Toggle Sidebar Menu
            , toggle_side_menu: function () {
                // @todo
                jQuery("body").toggleClass(class_names_for_sidebar);
            }
        }
        , computed: {
            activeComponentGet: function () {
                /**
                 * liefert den Namen für die Aktive Komponente
                 *  damit diese umgeschalten werden kann <component v-is:"overview-component"></component>
                 */
                return this.activeComponent + "-component";
            }
        }
        , watch: {
            activeComponent: function () {
                // passenden Eintrag suchen
                // und change_active_component() aufrufen
                for (let comp of this.menuEntries) {
                    if (comp.name === this.activeComponent) {
                        this.change_active_component(comp);
                        // erledigt
                        return;
                    }
                }

                // Es wurde kein passender Component gefunden, Fehler
                throw "Kein passender Component gefunden (AppBody.watch.activeComponent())";
            }
        }
        , components: {
            // Komponenten manuell hinzufügen
            OverviewComponent
            , EditComponent
            , ConfigComponent
            , ListComponent
            , LoadExternalComponent
            /* , HelpComponent */
        }
    });

    // zusätzlicher Listener
    AppBody.$on("usi:lang", function () {
        AppBody.replace_language_attributes();
    });

    /**
     * Falls ein Component seine Daten erhalten hat,
     * kann er sie so zurücksetzen
     */
    AppBody.$on("usi:reset-extraData", function () {
        AppBody.extraData = {};
    });
    
    /**
     * Lädt die Konfiguration neu, falls diese geändert wurde
     */
    AppBody.$on("usi:refresh-config", function () {
        config_storage().get().then(function (config: usi.Storage.Config) {
            AppBody.configuration = config;
        });
    });

    /**
     * Ändert das Zusätzliche CSS
     */
    AppBody.$on("usi:change-additional-css", function (text : string) {
        AppBody.change_css(text);
    });

}).catch((message: any) => {
    /** Fehler beim Laden der Konfiguration */
    console.error('Error in loading usi:config_storage');
    console.error(message);
    alert(message);
});