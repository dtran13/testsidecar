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
    // Can be set by routing.start().
    var _routes;

    /**
     * Manages routing behavior.
     *
     * The default implementation provides `before` and `after` callbacks that are executed
     * before and after a route gets triggered.
     *
     * @class Core.Routing
     * @singleton
     * @alias SUGAR.App.routing
     */
    app.augment("routing", {

        /**
         * Checks if a user is authenticated before triggering a route.
         * @param {String} route Route name.
         * @param args(optional) Route parameters.
         * @return {Boolean} Flag indicating if the route should be triggered (`true`).
         */
        beforeRoute: function(route, args) {
            if (!this.triggerBefore("route", {route:route, args:args}))
                return false;

            // skip this check for all white-listed routes (app.config.unsecureRoutes)]
            if (_.indexOf(app.config.unsecureRoutes, route) >= 0) return true;

            // Check if a user is un-athenticated and redirect him to login
            if (!app.api.isAuthenticated()) {
                app.router.login();
                return false;
            }
            else if (!app.isSynced) {
                Backbone.history.stop();
                app.sync();
                return false;
            }
            return true;
        },

        /**
         * Gets called after a route gets triggered.
         *
         * The default implementation does nothing.
         * @param {String} route Route name.
         * @param args(optional) Route parameters.
         */
        after: function(route, args) {
            // Do nothing
        },

        /**
         * If default routes are not desired, overwrite defaults with an array of custom routes with their handlers.
         * @param customRoutes {Array} array of routes to replace sidecar routes with. In the format {route: "route", name: "routename", callback: function(){}}
         */
        setRoutes: function(customRoutes) {
            // Manipulate routes
            _routes = customRoutes;
        },

        /**
         * Should be called when app has finished loading all the necessary files. This
         * will create an instance of Backbone router.
         */
        start: function() {
            var opts = {};

            if (_routes) {
                opts.customRoutes = _routes;
            }

            app.augment("router", new app.Router(opts), false);
            app.router.start();
        }
    });

    //Mix in the beforeEvents
        _.extend(app.routing, app.beforeEvent);

    /**
     * Router manages the watching of the address hash and routes to the correct handler.
     *
     * #NOTE# The default router has no routes, routes will need to be provided via a custom route object
     * from the platform.js file. Custom routes can use predefined route handlers on the default router.
     *
     * Deprecated Routes:
     *
     * "": "index",
     * "logout": "logout",
     * "logout/?clear=:clear": "logout",
     * ":module": "list",
     * ":module/layout/:view": "layout",
     * ":module/create": "create",
     * ":module/:id/:action": "record",
     * ":module/:id": "record"
     *
     * @class Core.Router
     * @singleton
     * @alias SUGAR.App.router
     */
    app.Router = Backbone.Router.extend({

        /**
         * Sets custom routes and binds them if available.
         * @param {Object} [opts] options to initialize the router.
         * @param {Object} [opts.customRoutes] customRoutes to override the
         * default sidecar ones.
         */
        initialize: function(opts) {
            opts = opts || {};
            if (opts.customRoutes) {
                this.customRoutes = opts.customRoutes;
                this._bindCustomRoutes();
            }
        },

        /**
         * Iterates over an array of custom routes and binds them, much like
         * the default routes.
         *
         * Note: The original routes hash does not support having inline callback
         * functions so this method allows for passing in callbacks with the routes.
         * @private
         */
        _bindCustomRoutes: function() {
            if (!this.customRoutes) return;

            this.customRoutes.reverse();

            _.each(this.customRoutes, function(route) {
                // Check if route uses a predefined callback on router, else use supplied callback.
                this.route(route.route, route.name, route.callback);
            }, this);
        },

        /**
         * Calls {@link Core.Routing#before} before invoking a route handler
         * and {@link Core.Routing#after} after the handler is invoked.
         *
         * @param {Function} handler Route callback handler.
         * @private
         */
        _routeHandler: function(handler) {
            var args = Array.prototype.slice.call(arguments, 1),
                route = handler.route;

            if (app.routing.beforeRoute(route, args)) {
                handler.apply(this, args);
                app.routing.after(route, args);
            }
        },

        /**
         * Registers a handler for a named route.
         *
         * This method wraps the handler into {@link Core.Router#_routeHandler} method.
         *
         * @param {String} route Route expression.
         * @param {String} name Route name.
         * @param {Function/String} callback Route handler.
         */
        route: function(route, name, callback) {
            if (!callback) callback = this[name];
            callback.route = name;
            callback = _.wrap(callback, this._routeHandler);
            Backbone.Router.prototype.route.call(this, route, name, callback);
        },

        /**
         * Navigates to the previous route in history.
         *
         * This method triggers route change event.
         */
        goBack: function() {
            app.logger.debug("Navigating back...");
            window.history.back();
        },

        /**
         * Navigates the window history.
         *
         * @param {Number} steps Number of steps to navigate (can be negative).
         */
        go: function(steps) {
            window.history.go(steps);
        },

        /**
         * Starts Backbone history which in turn starts routing the hashtag.
         *
         * See Backbone.history documentation for details.
         */
        start: function() {
            app.logger.info("Router Started");
            Backbone.history.stop();
            return Backbone.history.start();
        },

        /**
         * Re-trigger the current route.
         * Used to refresh the current layout/page without doing a hard refresh.
         */
        refresh: function(){
            Backbone.history.loadUrl(Backbone.history.fragment);
        },

        /**
         * Builds a route.
         *
         * This is a convenience function.
         * If you need to override this, define a customBuildRoute function on
         * `app.utils` and return empty string if you want to fallback to this
         * definition of build route.
         *
         * @param {Core.Context/String} moduleOrContext The name of the module
         * or a context object to extract the module from.
         * @param {String} id The model's ID.
         * @param {String} [action] Action name.
         * @return {String} route The built route.
         */
        buildRoute: function(moduleOrContext, id, action) {
            var route;

            if (app.utils && _.isFunction(app.utils.customBuildRoute)) {
                route = app.utils.customBuildRoute.apply(this, arguments);
                if (!_.isEmpty(route)) {
                    return route;
                }
            }

            if (moduleOrContext) {
                // If module is a context object, then extract module from it
                route = (_.isString(moduleOrContext)) ? moduleOrContext : moduleOrContext.get("module");

                if (id) {
                    route += "/" + id;
                }

                if (action) {
                    route += "/" + action;
                }
            } else {
                route = action;
            }

            return route;
        },

        // ----------------------------------------------------
        // Route handlers
        // ----------------------------------------------------

        /**
         * Handles `index` route.
         *
         * Loads `home` layout for `Home` module or `list` route with default module defined in app.config
         */
        index: function() {
            app.logger.debug("Route changed to index");
            if (app.config.defaultModule) {
                this.navigate(app.config.defaultModule, {trigger:true})
            }
            else if (app.acl.hasAccess('read', 'Home')) {
                this.navigate('Home', {trigger:true})
            }
        },

        /**
         * Handles `list` route.
         * @param module Module name.
         */
        list: function(module) {
            app.logger.debug("Route changed to list of " + module);
            app.controller.loadView({
                module: module,
                layout: "records"
            });
        },

        /**
         * Handles arbitrary layout for a module that doesn't have a record associated with the layout.
         * @param module Module name.
         * @param layout Layout name.
         */
        layout: function(module, layout) {
            app.logger.debug("Route changed to layout: " + layout + " for " + module);
            app.controller.loadView({
                module: module,
                layout: layout
            });
        },

        /**
         * Handles `create` route.
         * @param module Module name.
         */
        create: function(module) {
            app.logger.debug("Route changed: create " + module);
            app.controller.loadView({
                module: module,
                create: true,
                layout: "edit"
            });
        },

        /**
         * Handles `login` route.
         */
        login: function() {
            app.logger.debug("Logging in");
            app.controller.loadView({
                module: "Login",
                layout: "login",
                create: true
            });
            if(app.config.externalLogin) {
            	// this will cause reauth
            	app.api.call('read', app.api.buildURL('ping'), {}, {
            			success: function() {
            				app.router.refresh();
            			},
            			error: function() {
            				app.alert.show('needs_login_error', {
            						level: "error", 
            						messages: app.lang.getAppString('LBL_PORTAL_INVALID_CREDS_TITLE'), 
            						title: app.lang.get('LBL_PORTAL_INVALID_CREDS_TITLE'), 
            						autoClose: false
            				});
            			}
            	}, {'skipMetadataHash': true})
            	return;
            }
        },

        /**
         * Handles `logout` route.
         */
        logout: function(clear) {
            clear = (clear === "1");
            app.logger.debug("Logging out: " + clear);
            app.logout({
                complete: function() {
            		app.router.navigate("#");
                	if(app.config.externalLogin) {
                		app.controller.loadView({
                            module: "Login",
                            layout: "logout",
                            skipFetch: true,
                            create: true
                        });
                	} else {
                		app.router.login();
                	}
                }
            }, clear);
        },

        /**
         * Handles `record` route.
         * @param module Module name.
         * @param id Record ID.
         * @param action(optional) Action name (`edit`, etc.). Defaults to `detail` if not specified.
         */
        record: function(module, id, action) {
            var oldCollection = app.controller.context.get('collection'),
                oldListCollection = app.controller.context.get('listCollection'),
                opts = {
                    module: module,
                    layout: "record",
                    action: (action || "detail")
                };

            if (id !== "create") {
                _.extend(opts, {modelId: id});
            } else {
                _.extend(opts, {create: true});
                opts.layout = "create";
            }

            //If we come from a list view, we get the current collection
            if (oldCollection && oldCollection.module === module && oldCollection.get(id)) {
                opts.listCollection = oldCollection;
            }

            //If we come from a detail view, we need to get the cached collection
            if (oldListCollection && oldListCollection.module === module && oldListCollection.get(id)) {
                opts.listCollection = oldListCollection;
            }

            app.controller.loadView(opts);
        }
    });
})(SUGAR.App);

