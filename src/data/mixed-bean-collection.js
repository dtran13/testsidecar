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
 * Mixed collection class.
 *
 * **Filtering and searching**
 *
 * The collection's {@link Data.BeanCollection#fetch} method supports filter and search options.
 * For example, to search across accounts, opportunities, and contacts for favorite records
 * that have `"Acme"` string in their searchable fields:
 * <pre><code>
 * (function(app) {
 *
 *     var records = app.data.getMixedBeanCollection();
 *     records.fetch({
 *         favorites: true,
 *         query: "Acme",
 *         module_list: "Accounts,Opportunities,Contacts"
 *     });
 *
 * })(SUGAR.App);
 * </code></pre>
 *
 *
 * @class Data.MixedBeanCollection
 * @alias SUGAR.App.MixedBeanCollection
 * @extends Data.BeanCollection
 */
(function(app) {

    app.augment("MixedBeanCollection", app.BeanCollection.extend({

        _prepareModel: function(model, options) {
            var module = model instanceof app.Bean ? model.module : model._module;
            this.model = app.data.getBeanClass(module);
            return app.BeanCollection.prototype._prepareModel.call(this, model, options);
        },

        /**
         * Fetches records.
         *
         * This method performs global search across multiple modules.
         * @param options(optional) Fetch options.
         *
         * - module_list: comma-delimited list of modules to search across. The default is a list of all displayable modules.
         *
         * See {@link Data.BeanCollection#fetch} method for details about the reset of the options.
         *
         */
        fetch: function(options) {
            options = options || {};
            // We set a list of all modules by default
            options.module_list = this.module_list = options.module_list || this.module_list || app.metadata.getModuleNames();
            return app.BeanCollection.prototype.fetch.call(this, options);
        },

        /**
         * Groups models by module name.
         * @return {Object} Sets of models. Key is module name, value is array of models.
         */
        groupByModule: function() {
            return _.groupBy(this.models, function(model) {
                return model.module;
            });
        },

        /**
         * Returns string representation of this collection:
         * <code>mcoll:[length]</code>
         * @return {String} string representation of this collection.
         */
        toString: function() {
            return "mcoll:" + this.length;
        }

    }), false);

}(SUGAR.App));
