/*********************************************************************************
 * The contents of this file are subject to the SugarCRM Master Subscription
 * Agreement (""License"") which can be viewed at
 * http://www.sugarcrm.com/crm/master-subscription-agreement
 * By installing or using this file, You have unconditionally agreed to the
 * terms and conditions of the License, and You may not use this file except in
 * compliance with the License.  Under the terms of the license, You shall not,
 * among other things: 1) sublicense, resell, rent, lease, redistribute, assign
 * or otherwise transfer Your rights to the Software, and 2) use the Software
 * for timesharing or service bureau purposes such as hosting the Software for
 * commercial gain and/or for the benefit of a third party.  Use of the Software
 * may be subject to applicable fees and any use of the Software without first
 * paying applicable fees is strictly prohibited.  You do not have the right to
 * remove SugarCRM copyrights from the source code or user interface.
 *
 * All copies of the Covered Code must include on each user interface screen:
 *  (i) the ""Powered by SugarCRM"" logo and
 *  (ii) the SugarCRM copyright notice
 * in the same form as they appear in the distribution.  See full license for
 * requirements.
 *
 * Your Warranty, Limitations of liability and Indemnity are expressly stated
 * in the License.  Please refer to the License for the specific language
 * governing these rights and limitations under the License.  Portions created
 * by SugarCRM are Copyright (C) 2004-2012 SugarCRM, Inc.; All Rights Reserved.
 ********************************************************************************/
/**
 * Application configuration.
 * @class Config
 * @alias SUGAR.App.config
 * @singleton
 */
(function(app) {

    app.augment("config", {
        /**
         * Application identifier.
         * @cfg {String}
         */
        appId: 'portal',

        /**
         * Application environment. Possible values: 'dev', 'test', 'prod'
         * @cfg {String}
         */
        env: 'dev',

        /**
         * Flag indicating whether to output Sugar API debug information.
         * @cfg {Boolean}
         */
        debugSugarApi: true,

        /**
         * Logging level.
         * @cfg {Object} [logLevel=Utils.Logger.Levels.DEBUG]
         */
        logLevel: 'DEBUG',

        /**
         * Logging writer.
         * @cfg [logWrtiter=Utils.Logger.ConsoleWriter]
         */
        logWriter: 'ConsoleWriter',

        /**
         * Logging formatter.
         * @cfg [logFormatter=Utils.Logger.SimpleFormatter]
         */
        logFormatter: 'SimpleFormatter',

        /**
         * Sugar REST server URL.
         *
         * The URL can be relative or absolute.
         * @cfg {String}
         */
        serverUrl: '../../sugarcrm/rest/v10',

        /**
         * Sugar site URL.
         *
         * The URL can be relative or absolute.
         * @cfg {String}
         */
        siteUrl: '../../sugarcrm',

        /**
         * Minimal server version a client is compatible with.
         * @cfg {String}
         */
        minServerVersion: "6.6",

        /**
         * Server request timeout (in seconds).
         * @cfg {Number}
         */
        serverTimeout: 30,

        /**
         * Max query result set size.
         * @cfg {Number}
         */
        maxQueryResult: 20,

        /**
         * Max search query result set size (for global search)
         * @cfg {Number}        
         */
        maxSearchQueryResult: 3,

        /**
         * A list of routes that don't require authentication (in addition to `login`).
         * @cfg {Array}
         */
        unsecureRoutes: ["signup", "error"],

        /**
         * Platform name.
         * @cfg {String}
         */
        platform: "portal",

        /**
         * Default module to load for the home route (index).
         * If not specified, the framework loads `home` layout for the module `Home`.
         */
        defaultModule: "Cases",

        /**
         * A list of metadata types to fetch by default.
         * @cfg {Array}
         */
        metadataTypes: [],
        
        /**
         * The field and direction to order by.
         *
         * For list views, the default ordering. 
         * <pre><code>
         *         orderByDefaults: {
         *            moduleName: {
         *                field: '<name_of_field>',
         *                direction: '(asc|desc)'
         *            }
         *        }
         * </pre></code>
         * 
         * @cfg {Object}
         */
        orderByDefaults: {
            'Cases': {
                field: 'case_number',
                direction: 'asc'
            },
            'Bugs': {
                field: 'bug_number',
                direction: 'asc'
            },
            'Notes': {
                field: 'date_modified',
                direction: 'desc'
            }
        },
 
        /**
         * Hash of addtional views of the format below to init and render on app start
         ** <pre><code>
         *         additionalComponents: {
         *            viewName: {
         *                target: 'CSSDomselector'
         *            }
         *        }
         * </pre></code>
         * @cfg {Object}
         */
        additionalComponents: {
            header: {
                target: '#header'
            },
            footer: {
                target: '#footer'
            }
        },

        /**
         * Alerts element selector.
         * @cfg {String}
         */
        alertsEl: '#alerts',

        /**
         * Alert dismiss timeout in milliseconds.
         * @cfg {Number}
         */
        alertAutoCloseDelay: 9000,

        /**
         * Array of modules to display in the nav bar
         ** <pre><code>
         *         displayModules: [
         *            'Bugs',
         *            'Cases
         *        ]
         * </pre></code>
         * @cfg {Array}
         */
        displayModules : [
            'Bugs',
            'Cases',
            'KBDocuments'
        ],

        /**
         * Client ID for oAuth
         * Defaults to sugar other values are support_portal
         * @cfg {Array}
         */
        clientID: "sugar",

        /**
         * Syncs config from server on app start
         * Defaults to true otherwise set to false
         * @cfg {Boolean}
         */
        syncConfig: true,
        
        /**
         * Loads css dinamically when the app inits
         * Defaults to false otherwise set "url" or "text"
         * @cfg {String}
         */
        loadCss : false

    }, false);

})(SUGAR.App);
