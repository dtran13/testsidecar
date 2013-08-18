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
 * Base bean collection class.
 *
 * **Filtering and searching**
 *
 * The collection's {@link Data.BeanCollection#fetch} method supports filter and seach options.
 * For example, to search favorite accounts that have `"Acme"` string in their name:
 * <pre><code>
 * (function(app) {
 *
 *     var accounts = app.data.createBeanCollection("Accounts");
 *     accounts.fetch({
 *         favorites: true,
 *         query: "Acme"
 *     });
 *
 * })(SUGAR.App);
 * </code></pre>
 *
 *
 * @class Data.BeanCollection
 * @alias SUGAR.App.BeanCollection
 * @extends Backbone.Collection
 */
(function(app) {

    app.augment("BeanCollection", Backbone.Collection.extend({
        initialize: function(options) {
            /**
             * private copy of initial options for collection for reset
             * @type {*}
             * @private
             */
            this._initOptions = app.utils.deepCopy(options);
            Backbone.Collection.prototype.initialize.call(this, options);
        },
        constructor: function(models, options) {
            if (options && options.link) {
                this.link = options.link;
                delete options.link;
            }
            Backbone.Collection.prototype.constructor.call(this, models, options);
        },

        _prepareModel: function(model, options) {
            var searchInfo = model._search;
            delete model._search;

            model = Backbone.Collection.prototype._prepareModel.call(this, model, options);
            if (model && !model.link) model.link = this.link;
            if (searchInfo) {
                /**
                 * FTS search results.
                 * @member Data.Bean
                 * @property {Object}
                 *
                 * Example:
                 * <pre>
                 * {
                 *   highlighted: {
                 *      account_name: {
                 *        label: "LBL_ACCOUNT_NAME",
                 *        module: "Leads",
                 *        text: "Kings Royalty &lt;span class="highlight"&gt;Trust&lt;/span&gt;"
                 *      }
                 *    },
                 *    score: 1
                 * }
                 * </pre>
                 */
                model.searchInfo = searchInfo;
            }
            return model;
        },

        /**
         * Fetches beans.
         *
         * @param options(optional) fetch options
         *
         * - relate: boolean flag indicating that relationships should be fetched.
         * - myItems: boolean flag indicating to fetch records assigned to the current user only
         * - favorites: boolean flag indicating to fetch favorites
         * - query: search query string
         * - add: boolean flag indicating if new records should be appended to the collection.
         * - success: success callback.
         * - error: error callback.
         *
         * See {@link Data.BeanCollection#paginate} for details about pagination options.
         */
        fetch: function(options) {
            options = _.extend({}, this.options, options);

            /**
             * Field names.
             *
             * A list of fields that are populated on collection members.
             * This property is used to build `fields` URL parameter when fetching beans.
             * @member Data.BeanCollection
             * @property {Array}
             */
            options.fields = this.fields = options.fields || this.fields || null;
            options.myItems = _.isUndefined(options.myItems) ? this.myItems : options.myItems;
            options.favorites = _.isUndefined(options.favorites) ? this.favorites : options.favorites;
            options.query = _.isUndefined(options.query) ? this.query : options.query;

            this.options = options;
            return Backbone.Collection.prototype.fetch.call(this, options);
        },
        /**
         * resets pagination properties on a collection to initial options, otherwise defaults to first page
         */
        resetPagination:function(){
            var paginationDefaults = {offset: 0, next_offset: 0, page: 1};
            var optKeys = _.keys(paginationDefaults);
            this.resetOptions(optKeys);
            _.each(optKeys, function(optKey) {
               if (this.options && this.options[optKey]) {
                   this[optKey] = this.options[optKey];
               } else {
                   this[optKey] = paginationDefaults[optKey];
               }
            }, this);
        },
        /**
         * resets optionsList to original values from init, clears them if no optionsList specified
         * @param {Array} optionsList (optional) array of option keys to reset
         * @returns {boolean}
         */
        resetOptions: function (optionsList) {
            if (!optionsList && this._initOptions) {
                // reset options if no specific ones are specified
                this.options = this._initOptions
            } else if (optionsList && this._initOptions) {
                // reset specific options if specified
                _.each(optionsList, function (option) {
                    if (!_.isUndefined(this._initOptions[option])) {
                        this.options[option] = this._initOptions[option];
                    } else {
                        delete this.options[option];
                    }
                });
            } else {
                // clear options if none existed when we started
                this.options = null;
            }
        },

        /**
         * Paginates a collection.
         *
         * @param options(optional) fetch options
         *
         * - page: page index (integer) from the current page to paginate to.
         *
         * For other options see {@link Data.BeanCollection#fetch} method.
         */
        paginate: function(options) {
            options = options || {};
            var maxSize = options.limit || app.config.maxQueryResult;
            options.page = options.page || 1;

            // fix page number since our offset is already at the end of the collection subset
            options.page--;

            if (maxSize) {
                options.offset = this.offset + (options.page * maxSize);
            }

            if (options.add){
                options = _.extend({update:true, remove:false}, options);
            }

            this.fetch(options);
        },

        /**
         * Gets the current page of collection being displayed depending on the offset.
         *
         * @param options(Optional) fetch options used when paginating
         *
         * - limit: When set, it is the size of each page otherwise we use app.config.maxQueryResult
         *
         * @return {Number} current page number.
         */
        getPageNumber: function(options) {
            var pageNumber = 1;
            var maxSize = app.config.maxQueryResult;
            if(options){
                maxSize = options.limit || maxSize;
            }
            if (this.offset && maxSize) {
                pageNumber = Math.ceil(this.offset / maxSize);
            }
            return pageNumber;
        },

        /**
         * Returns string representation useful for debugging:
         * <code>coll:[module-name]-[length]</code>  or
         * <code>coll:[related-module-name]/[id]/[module-name]-[length]</code> if it's a collection of related beans.
         * @return {String} string representation of this collection.
         */
        toString: function() {
            return "coll:" + (this.link ?
                (this.link.bean.module + "/" + this.link.bean.id + "/") : "") +
                this.module + "-" + this.length;
        }

    }), false);

}(SUGAR.App));
