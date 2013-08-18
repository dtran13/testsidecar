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

    var _updateProperty = function(bean, prop, attr, obj) {
        //"use strict";
        if (prop in obj) {
            bean[attr] = obj[prop];
            obj[prop] = undefined;
            // TODO: delete doesn't work because the obj is frozen
            // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
            //delete obj[prop];
        }
        return false;
    };

    app.Offline.Bean = app.Bean.extend({

        initialize: function(attrs) {
            this.syncState = null;
            this.modifiedAt = null;
            return app.Bean.prototype.initialize.call(this, attrs);
        },

        set: function(attrs, options) {
            // I want to handle syncState and modifiedAt separately from the attrs hash
            // TODO: Am I overcomplicating things?
            if (attrs) {
                _updateProperty(this, '_sync_state', 'syncState', attrs);
                _updateProperty(this, '_modified_at', 'modifiedAt', attrs);
            }
            return app.Bean.prototype.set.call(this, attrs, options);
        },

        toString: function() {
            return app.Bean.prototype.toString.call(this) + " [" + this.syncState + "/" + this.modifiedAt + "]";
        }

    });

})(SUGAR.App);