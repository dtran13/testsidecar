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
(function(app) {
    /**
     * Controller manages the loading and unloading of layouts within the app.
     *
     * **Extending controller**
     *
     * Application may choose to extend the controller to provide custom implementation.
     * Your custom controller class name should be capiltalized {@link Config#appId} followed by `Controller` word.
     * <pre><code>
     * (function(app) {
     *
     *     app.PortalController = app.Controller.extend({
     *
     *         loadView: function(params) {
     *            // Custom implementation of loadView
     *
     *            // Should you need to call super method:
     *            app.Controller.prototype.loadView.call(this, params);
     *         }
     *
     *     });
     *
     * })(SUGAR.App);
     * </code></pre>
     *
     * @class Core.Controller
     * @singleton
     * @alias SUGAR.App.controller
     */
    var Controller = Backbone.View.extend({
        /**
         * Initializes this controller.
         * @private
         * @constructor
         * @ignore
         */
        initialize: function() {
            /**
             * The primary context of the app.
             * This context is associated with the root layout.
             * @property {Core.Context}
             */
            this.context = app.context.getContext();

            app.events.on("app:sync:complete", function() {
                _.each(app.additionalComponents, function(component) {
                    if (component && _.isFunction(component._setLabels)) {
                        component._setLabels();
                    }
                    component.render();
                });
                app.router.start();
            });

            app.events.on("app:login:success", function() {
                app.sync();
            });
        },

        /**
         * Loads a view (layout).
         *
         * This method is called by the router when the route is changed.
         *
         * @param {Object} params Options that determine the current context and the view to load.

         * - id: ID of the record to load (optional)
         * - module: module name
         * - layout: Name of the layout to .oad
         */
        loadView: function(params) {

            var oldLayout =  this.layout;

            // Reset context and initialize it with new params
            this.context.clear({silent: true});
            this.context.set(params);

            // Prepare model and collection
            this.context.prepare();
            // Create an instance of the layout and bind it to the data instance
            this.layout = app.view.createLayout({
                name: params.layout,
                module: params.module,
                context: this.context
            });

            // Render the layout to the main element
            app.$contentEl.html(this.layout.$el);

            // Fetch the data, the layout will be rendered when fetch completes
            if(!params || (params && !params.skipFetch)) {
                this.layout.loadData();
            }

            // Render the layout with empty data
            this.layout.render();

            if (oldLayout) {
                oldLayout.dispose();
            }

            app.trigger("app:view:change", params.layout, params);
        },

        /**
         * Creates, renders, and registers within the app additional components.
         */
        loadAdditionalComponents: function(components) {
            // Unload components that may be loaded previously
            _.each(app.additionalComponents, function(component) {
                if (component) {
                    component.remove();
                    component.dispose();
                }
            });
            app.additionalComponents = {};
            _.each(components, function(component, name) {
                if(component.target) {
                    if(component.layout) {
                        app.additionalComponents[name] = app.view.createLayout({
                            context: this.context,
                            name: component.layout,
                            el: this.$(component.target)
                        });
                    } else {
                        app.additionalComponents[name] = app.view.createView({
                            name: component.view || name,
                            context: this.context,
                            el: this.$(component.target)
                        });
                    }
                    app.additionalComponents[name].render();
                } else {
                    app.logger.error("Unable to create Additional Component '" + name + "'; No target specified.");
                }
            });
        }
    });

    app.augment("Controller", Controller, false);

    app.events.on("app:init", function(app) {
        app.controller.setElement(app.$rootEl);
    }, app.controller).on("app:start", function(app) {
        app.controller.loadAdditionalComponents(app.config.additionalComponents);
    });

})(SUGAR.App);
