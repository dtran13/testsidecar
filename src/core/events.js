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
     * Events proxy object. For inter-component communications, please register your events and please subscribe
     * your events from the events hub. This allows components to not depend on each other in a tightly coupled capacity.
     *
     * <pre><code>
     * (function(app) {
     *   var foo = {
     *     initialize: function() {
     *         // Register the event with the events hub.
     *         app.events.register("mynamespaced:event", this);
     *     },
     *     action: function() {
     *         // Broadcast you revent to the events hub.
     *         // The events hub will then broadcast this event to all its subscribers.
     *         this.trigger("mynamespaced:event");
     *     }
     *   }
     *
     *   var bar = {
     *     initialize: function() {
     *         // Call a callback when the event is received.
     *         app.events.on("mynamespaced:event", function() {
     *             alert("Event!");
     *         });
     *     }
     *   }
     *
     * })(SUGAR.App);
     * </pre></code>
     * @class Core.Events
     * @singleton
     * @alias SUGAR.App.events
     */
    app.augment("events", _.extend({

        /**
         * Registers an event with the event proxy.
         *
         * @param {String} event The name of the event.
         * A good practice is to namespace your events with a colon. For example: `"app:start"`
         * @param {Backbone.Events} context The object that will trigger the event.
         * @method
         */
        register: function(event, context) {
            context.on(event, function() {
                var args = [].slice.call(arguments, 0);
                args.unshift(event);
                this.trigger.apply(this, args);
            }, this);
        },

        /**
         * Unregisters an event from the event proxy.
         *
         * @param {Object} context Source to be cleared from
         * @param {String} event(optional) Event name to be cleared
         * @method
         */
        unregister: function(context, event) {
            context.off(event);
        },

        /**
         * Subscribe to global ajax events.
         */
        registerAjaxEvents: function() {
            var self = this;

            // First unbind then rebind
            $(document).off("ajaxStop");
            $(document).off("ajaxStart");

            $(document).on("ajaxStart", function(args) {
                self.trigger("ajaxStart", args);
            });

            $(document).on("ajaxStop", function(args) {
                self.trigger("ajaxStop", args);
            });
        }
    }, Backbone.Events));
    
})(SUGAR.App);
