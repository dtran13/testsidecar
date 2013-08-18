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

    var _db = null;
    var _executeStatements = function(tx, statements) {
        _.each(statements, function(stmt) {
            app.logger.trace(stmt);
            tx.executeSql(stmt);
        });
    };

    var _executeSql = function(sql, params, success, failure) {
        _db.transaction(function(tx) {
            app.logger.trace(sql);
            _preprocessParams(params);
            tx.executeSql(sql, params, success, failure);
        });
    };

    var _preprocessParams = function(params) {
        _.each(params, function(value, key) {
            if (_.isBoolean(value)) {
                params[key] = value ? 1 : 0;
            }
        });
    };

    /**
     * WebSQL wrapper.
     * @ignore
     */
    app.augment("webSqlAdapter", {

        open: function(name, version, size) {
            if (_db) return;
            _db = window.openDatabase(name, version, name, size);
            if (!_db) throw new Error('"openDatabase" returned nothing');
            app.logger.debug('Opened database ' + name + ' ' + version + ' (' + size + ' bytes)');
        },

        executeInTransaction: function(callback, success, failure) {
            _db.transaction(callback, failure, success);
        },

        executeStatements: function(tx, statements, success, failure) {
            if (tx) {
                _executeStatements(tx, statements);
            }
            else {
                _db.transaction(function(tx) {
                    _executeStatements(tx, statements);
                }, failure, success);
            }
        },

        executeStatement: function(tx, stmt, params) {
            app.logger.trace(stmt);
            _preprocessParams(params);
            tx.executeSql(stmt, params);
        },

        executeSql: function(tx, sql, params, success, failure) {
            (tx ?
                this.executeStatement(tx, sql, params) :
                _executeSql(sql, params, success, failure));
        }

    });

})(SUGAR.App);