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
     * SugarField widget. A field widget is a low level field widget. Some examples of fields are
     * text boxes, date pickers, drop down menus.
     *
     * ##Creating a SugarField
     * SugarCRM allows for customized "fields" which are visual representations of a type of data (e.g. url would
     * be displayed as a hyperlink).
     *
     * ###Anatomy of a SugarField
     * Field files reside in the **`sugarcrm/clients/base/fields/{field_type}`** folder.
     *
     * Inside the {field_type} directory is a set of files that define templates for different views and field controller.
     * A typical directory structure will look like the following:
     * <pre>
     * clients
     * |- base
     *    |- bool
     *       |- bool.js
     *       |- detail.hbs
     *       |- edit.hbs
     *       |- list.hbs
     *    |- int
     *       ...
     *    |- text
     *       ...
     * |- portal
     *    |- portal specific overrides
     * |- mobile
     *    |- mobile specific overrides
     * </pre>
     * **`[sugarFieldType].js`** files are optional.
     * Sometimes a SugarField needs to do more than just display a simple input element, other times input elements
     * need additional data such as drop down menu choices. To support advanced functionality, just add your additional
     * controller logic to **`[sugarFieldType].js`** javascript file where sugarFieldType is the type of the SugarField.
     * Example for `bool.js` controller:
     * <pre><code>
     * ({
     *    events: {
     *         handler: function() {
     *             // Actions
     *         }
     *    },
     *
     *    initialize: function(options) {
     *       app.view.Field.prototype.initialize(options);
     *       // Your constructor code here follows...
     *    },
     *
     *    unformat: function(value) {
     *        value = this.el.children[0].children[1].checked ? "1" : "0";
     *        return value;
     *    },
     *    format: function(value) {
     *        value = (value == "1") ? true : false;
     *        return value;
     *    }
     * })
     * </code></pre>
     *
     * **`.hbs`** files contain your templates corresponding to the type of {@link View.View} the field is to be displayed on.
     * Sugar uses Handlebars.js as its client side template of choice. At this time no other templating engines are
     * supported. Sample:
     * <pre><code>
     * &lt;span name="{{name}}"&gt;{{value}}&lt;/span&gt;
     * </code></pre>
     *
     * These files will be used by the metadata manager to generate metadata for your SugarFields and pass them onto the
     * Sugar JavaScript client.
     *
     * </pre></code>
     *
     * ####SugarField Template Values
     * TODO:
     *
     *
     * @class View.Field
     */
    app.view.Field = app.view.Component.extend({

        /**
         * HTML tag of the field.
         * @property {String}
         */
        fieldTag: "input",

        /**
         * TODO: add docs (describe options, see Component class for details)
         * @param options
         */
        initialize: function(options) {
            app.plugins.attach(this, "field");
            app.view.Component.prototype.initialize.call(this, options);

            /**
             * ID of the field (autogenerated).
             * @property {Number}
             * @member View.Field
             */
            this.sfId = options.sfId;

            /**
             * Reference to the view this field is attached to.
             * @property {View.View}
             * @member View.Field
             */
            this.view = options.view;

            /**
             * Field name.
             * @property {String}
             * @member View.Field
             */
            this.name = this.options.def.name;

            /**
             * Widget type (text, bool, int, etc.).
             * @property {String}
             * @member View.Field
             */
            this.type = this.options.def.type;

            if (this.model && this.model.fields) {
                // Set module field definition (vardef)
                var clonedVarDef = _.clone(this.model.fields[this.name]);
                /**
                 * Field metadata definition (vardef + viewdef).
                 *
                 * Viewdef are copied over vardef.
                 * @property {Object}
                 * @member View.Field
                 */
                // Beware of shallow clone! We assume here that vardef object has only primitive types
                this.def = clonedVarDef ? _.extend(clonedVarDef, options.def) : options.def;
            }
            else {
                this.def = this.options.def;
            }

            /**
             * i18n-ed field label.
             * @property {String}
             * @member View.Field
             */
            this.label = app.lang.get(this.def.label || this.def.vname || this.name, this.module);

            /**
             * Compiled template.
             * @property {Function}
             * @member View.Field
             */
            this.template = app.template.empty;

            // Bind validation error event
            // Note we bind it regardless of which view we on (only need for edit type views)
            if (this.model) {
                this.model.on("error:validation:" + this.name, this.handleValidationError, this);
            }
            this.trigger("init");
        },

        /**
         * Defines fallback rules for ACL checking.
         *
         * For example, if a user doesn't have `edit` permission for the given field
         * the template falls back to `detail` view template.
         */
        viewFallbackMap: {
            'edit': 'detail'
        },

        /**
         * Checks ACLs to see if the current user has access to action.
         *
         * @param {String} action Action name.
         * @return {Boolean} Flag indicating if the current user has access to the given action.
         * see {@link View.Field#_loadTemplate}
         */
        _checkAccessToAction: function(action) {
            return app.acl.hasAccessToModel(action, this.model, this.name);
        },
        /**
         * Returns fallback template for view
         *
         * @param {string} viewName
         * @return {string}
         * @private
         */
        _getFallbackTemplate: function(viewName) {
            return (this.isDisabled() && viewName === 'disabled') ? 'edit' :
                (this.view.fallbackFieldTemplate || 'detail');
        },
        /**
         * Loads template for this field.
         * @private
         */
        _loadTemplate: function() {
            var fallbackFieldTemplate;

            // options.viewName or view metadata type is used to override the template
            var viewName = this.options.viewName || this.options.def.view ||
                (this.view.meta && this.view.meta.type ? this.view.meta.type : this.view.name);

            var actionName = this.action;
            if (this.isDisabled() && viewName === 'edit') {
                viewName = this.action;
            } else {
                actionName = this.action || (viewName != this.view.action ? this.view.action : viewName);
            }

            while (viewName) {

                if (this._checkAccessToAction(actionName)) break;
                viewName = this.viewFallbackMap[viewName];
                actionName = viewName;
            }

            if (viewName) {
                // Set fallback template to base/view or default.
                var moduleName = this.module || this.context.get('module');

                fallbackFieldTemplate = this._getFallbackTemplate(viewName);
                this.template = app.template.getField(this.type, viewName, moduleName, fallbackFieldTemplate) ||
                                // Fallback to text field if template is not defined for this type
                                app.template.getField("base", viewName, moduleName, fallbackFieldTemplate) ||
                                // Safeguard with an empty template
                                app.template.empty;
            } else {
                // Safeguard with an empty template
                this.template = app.template.empty;
            }

            // Update template name and action.
            // These properties are useful for a client app to make decisions when formatting values, rendering, etc.
            /**
             * Template (view) name.
             *
             * The view name can be different from the one the field belongs to.
             * The template is selected based on ACLs. It may also be overridden by field's metadata definition.
             * @property {String}
             * @member View.Field
             */
            this.tplName = viewName;
            /**
             * Action name.
             *
             * The action the field is rendered for. Usually, the action name equals to {@link View.Field#tplName}.
             * @property {String}
             * @member View.Field
             */
            this.action = actionName;
        },

        /**
         * Override default Backbone.Events to also use custom handlers.
         *
         * The events hash is similar to Backbone.View events hash. The framework stores the event handlers as
         * part of the field instance with the `"callback_"` prefix.
         * <pre><code>
         * events: {
         *     handler: "function() {}";
         * }
         * </code></pre>
         * The above handler is stored as (`"this"` points to the instance of the `Field` class):
         * <pre><code>
         * this.callback_handler
         * </code></pre>
         * @private
         * @param {Object} events Hash of events and their handlers
         */
        delegateEvents: function(events) {
            // We may have:
            // this.events -- comes from custom .js controllers
            // this.def.events -- comes from metadata. See, for example, buttons section in portal.js file
            events = events || this.events || (this.def ? this.def.events : null);
            if (!events) return;

            events = _.clone(events);

            _.each(events, function(eventHandler, handlerName) {
                var callback = this[eventHandler];

                // If our callbacks / events have not been registered, go ahead and registered.
                if (!callback && _.isString(eventHandler)) {
                    try {
                        callback = eval("[" + eventHandler + "][0]");
                        // Store this callback if it is a function. Prefix it with "callback_"
                        if (_.isFunction(callback)) {
                            this["callback_" + handlerName] = callback;
                            events[handlerName] = "callback_" + handlerName;
                        }
                    } catch (e) {
                        app.logger.error("Failed to set up event callback '" + handlerName +
                            "' in " + this + "; error: " + e +
                            "\n---\n" + eventHandler);
                        delete events[handlerName];
                    }
                }

            }, this);

            Backbone.View.prototype.delegateEvents.call(this, events);
        },

        /**
         * Renders a field widget.
         *
         * This method checks ACLs to choose the correct template.
         * Once the template is rendered, DOM changes are bound to the model.
         * @return {Object} The instance of this field.
         */
        _render: function() {
            this._loadTemplate();
            if (this.model instanceof Backbone.Model) {
                /**
                 * Model property value.
                 * @property {String}
                 * @member View.Field
                 */
                this.value = this.format(this.model.has(this.name) ? this.model.get(this.name) : null);
            }

            this.unbindDom();
            this.$el.html(this.template(this) || '');

            // Adds classes to the component based on the metadata.
            if(this.def && this.def.css_class) {
                this.getFieldElement().addClass(this.def.css_class);
            }

            this.bindDomChange();
            return this;
        },

        /**
         * Get the correspond field DOM element
         *
         * This method will return the placeholder element.
         * Override this method in the subclass to point the specified field element
         *
         * @return {Object} DOM Element
         */
        getFieldElement: function() {
            return this.$el;
        },

        /**
         * Binds DOM changes to a model.
         *
         * The default implementation of this method binds value changes of {@link View.Field#fieldTag} element
         * to model's `Backbone.Model#set` method. Override this method if you need custom binding.
         */
        bindDomChange: function() {

            if (!(this.model instanceof Backbone.Model)) return;

            var self = this;
            var el = this.$el.find(this.fieldTag);
            el.on("change", function() {
                self.model.set(self.name, self.unformat(el.val()));
            });
            // Focus doesn't always change when tabbing through inputs on IE9 & IE10 (Bug54717)
            // This prevents change events from being fired appropriately on IE9 & IE10
            if($.browser.msie && el.is("input")){
                _.defer(function(el){
                    el.on("input", function() {
                        // Set focus on input element receiving user input
                        el.focus();
                    });
                }, el);
            }

        },

        /**
         * Binds model changes to this field.
         *
         * The default implementation makes sure this field gets re-rendered
         * whenever the corresponding model attribute changes.
         */
        bindDataChange: function() {
            if (this.model) {
                this.model.on("change:" + this.name, this.render, this);
            }
        },

        /**
         * Formats a value for display.
         *
         * The default implementation returns `value` without modifying it.
         * Override this method to provide custom formatting in field controller (`[type].js` file).
         * @param {Array/Object/String/Number/Boolean} value The value to format.
         * @return {String} Formatted value.
         */
        format: function(value) {
            return value;
        },

        /**
         * Unformats a value for storing in a model.
         *
         * The default implementation returns `value` without modifying it.
         * Override this method to provide custom unformatting in field controller (`[type].js` file).
         * @param {String} value The value to unformat.
         * @return {Array/Object/String/Number/Boolean} Unformatted value.
         */
        unformat: function(value) {
            return value;
        },

        /**
         * Handles validation errors.
         *
         * The default implementation does nothing.
         * Override this method to provide custom display logic.
         * <pre><code>
         * app.view.Field = app.view.Field.extend({
         *     handleValidationError: function(errors) {
         *       // Your custom logic goes here
         *     }
         * });
         * </code></pre>
         *
         * @param {Object} errors hash of validation errors
         */
        handleValidationError: function(errors) {
            // Override this method
        },

        /**
         * Gets HTML placeholder for a field.
         * @return {String} HTML placeholder for the field as Handlebars safe string.
         */
        getPlaceholder: function() {
            return new Handlebars.SafeString('<span sfuuid="' + this.sfId + '"></span>');
        },

        /**
         * Disables the edit mode by switching the element as detail mode
         * @param {Boolean} true or undefined to disable the edit mode
         *               otherwise, it will restore back to the previous mode
         */
        setDisabled: function(disable) {
            disable = _.isUndefined(disable) ? true : disable;

            if(disable && this.isDisabled() === false) {
                //Set disabled
                this._previousAction = this.action;
                this.action = 'disabled';
                this.render();
            } else if(disable === false && this.isDisabled()) {
                //disabled release
                this.action = this._previousAction;
                delete this._previousAction;
                this.render();
            }
        },

        /**
         * Is the field disabled?
         * @return {Boolean} true if the field is disabled, false otherwise.
         */
        isDisabled: function() {
            return (this.action === 'disabled');
        },

        /**
         * Set view name of this field.
         * This only switches the template reference.
         * @param {String} view name.
         */
        setViewName: function(view) {
            this.options.viewName = view;
        },

        /**
         * Set action name of this field.
         * This switches action name as well as the template reference.
         *
         * @param name {String} action name
         **/
        setMode: function(name) {
            if(this.isDisabled()) {
                this._previousAction = name;
            } else {
                this.action = name;
            }
            this.setViewName(name);
            this.render();
        },

        /**
         * Unbinds DOM changes from field's element.
         *
         * This method performs the opposite of what {@link View.Field#bindDomChange} method does.
         * Override this method if you need custom logic.
         */
        unbindDom: function() {
            this.$el.find(this.fieldTag).off();
        },

        /**
         * Disposes a field.
         *
         * Calls {@link View.Field#unbindDom} and {@link View.Component#_dispose} method of the base class.
         * @protected
         */
        _dispose: function() {
            app.plugins.detach(this, "field");
            this.unbindDom();
            app.view.Component.prototype._dispose.call(this);
        },

        /**
         * Gets a string representation of this field.
         * @return {String} String representation of this field.
         */
        toString: function() {
            return "field-" + this.name + "-" + this.sfId + "-" +
                app.view.Component.prototype.toString.call(this);
        },

        /**
         * Set current element's display property to be shown
         */
        show: function() {
            if (!this.isVisible()) {
                if (!this.triggerBefore("show")) {
                    return false;
                }

                this.getFieldElement().removeClass("hide").show();

                this.trigger('show');
            }
        },

        /**
         * Set current element's display property to be hidden
         */
        hide: function() {
            if (this.isVisible()) {
                if (!this.triggerBefore("hide")) {
                    return false;
                }

                this.getFieldElement().addClass("hide").hide();

                this.trigger('hide');
            }
        },

        /**
         *  Visibility Check
         */
        isVisible: function() {
            return this.getFieldElement().css('display') !== 'none';
        }
    });


})(SUGAR.App);

