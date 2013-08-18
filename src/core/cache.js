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
 * Persistent cache manager.
 *
 * By default, cache manager uses stash.js to manipulate items in `window.localStorage` object.
 * Use {@link Core.CacheManager#store} property to override the storage provider.
 * The value of the key which is passed as a parameter to `get/set/add` methods is prefixed with
 * `<env>:<appId>:` string to avoid clashes with other environments and applications running off the same domain name and port.
 * You can set environment and application ID in {@link Config} module.
 *
 * @class Core.CacheManager
 * @singleton
 * @alias SUGAR.App.cache
 */
(function(app) {

    var _keyPrefix = "";

    var _buildKey = function(key) {
        return _keyPrefix + key;
    };

    var _cache = {

        /**
         * Storage provider.
         *
         * Default: stash.js
         *
         * @cfg {Object}
         */
        // Not all stash.js's methods are available on cache module
        // We can add additional methods later if we need them (get, set, cut are the most used)
        store: stash,

        /**
         * Initializes cache manager.
         */
        init: function() {
            _keyPrefix = app.config.env + ":" + app.config.appId + ":";
        },

        /**
         * Checks if the item exists in cache.
         * @param {String} key Item key.
         */
        has: function(key) {
            // Only if we're in fact using the stash.js lib do we directly shim the has method. 
            // Otherwise, we delegate out to whatever this.store.has is.
            if(this.store === stash) {
                return window.localStorage.getItem(_buildKey(key)) !== null;
            } else {
                this.store.has(_buildKey(key));
            }
        },

        /**
         * Gets an item from the cache.
         * @param {String} key Item key.
         * @return {Function/Number/Boolean/String/Array/Object} Item with the given key.
         */
        get: function(key) {
            return this.store.get(_buildKey(key));
        },

        /**
         * Puts an item into cache.
         * @param {String} key Item key.
         * @param {Function/Number/Boolean/String/Array/Object} value Item to put.
         */
        set: function(key, value) {
            this.store.set(_buildKey(key), value);
        },

        /**
         * Add an item to an existing item.
         * @param {String} key Item key.
         * @param {Function/Number/Boolean/String/Array/Object} value Item to add.
         */
        add: function(key, value) {
            this.store.add(_buildKey(key), value);
        },

        /**
         * Deletes an item from cache.
         * @param {String} key Item key.
         */
        cut: function(key) {
            // Stash does delete ls[e] and IE9 complains if doesn't exist 
            if( this.store.has(_buildKey(key)) ) {
                this.store.cut(_buildKey(key));
            }
        },

        /**
         * Deletes all items from cache.
         *
         * By default, this method deletes all items for the current app and environment.
         * Pass `true` to this method to remove all items.

         * @param {Boolean} all(optional) Flag indicating if all items must be deleted from this cache.
         */
        cutAll: function(all) {
            if (all === true) return this.store.cutAll();
            _.each(this.store.getAll(), function(value, key) {
                if (key.indexOf(_keyPrefix) === 0) {
                    this.store.cut(key);
                }
            }, this);
        }

    };

    app.augment("cache", _cache);


})(SUGAR.App);
