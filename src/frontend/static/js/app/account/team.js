'use strict';
var $ = window.jQuery = window.$ = require('jquery'),
    typeahead = require('../../lib/vendor/typeahead'),
    api = require('../../lib/api'),
    redirect = require('../../lib/redirect');

$(function () {
    api.team.getAll().then(function (_teams) {
        var $joinTeam = $('#join_team'),
            $joinTeamBtn = $('#join_team_btn'),
            $createTeam = $('#create_team'),
            $createTeamBtn = $('#create_team_btn'),
            teams = _teams;

        $joinTeam
            .typeahead({
                hint: true,
                _highlight: true,
                minLength: 1
            }, {
                source: function (q, cb) {
                    var matches, substrRegex, team;
                    matches = [];
                    substrRegex = new RegExp(q, 'i');

                    for (var i = 0; i < teams.length; i++) {
                        team = teams[i];
                        if (substrRegex.test(team.name) || substrRegex.test(team.tag)) {
                            matches.push(team.name);
                        }
                    }

                    cb(matches);
                }
            })
            .bind('typeahead:select', function () {
                // self.update();
            });

        $joinTeam.on('keyup change', function () {
            $joinTeamBtn.addClass('disabled');
            var $this = $(this),
                $parent = $this.parent(),
                val = $this.val().trim().toLowerCase();
            for (var i = 0; i < teams.length; i++) {
                if (teams[i].name.trim().toLowerCase() == val) {
                    return $parent.removeClass('has-error');
                }
            }
            $parent.addClass('has-error');
        });

        $createTeam.on('keyup', function () {
            var $this = $(this),
                $parent = $this.parent(),
                $help = $parent.find('.help-block'),
                val = $this.val().toLowerCase().replace(/\s/g, '');

            $parent.removeClass('has-error');
            $createTeamBtn.removeClass('disabled');
            $help.text('');

            if (val.length < 4) {
                $createTeamBtn.addClass('disabled');
                if (val.length > 0) {
                    $parent.addClass('has-error');
                    $help.text('4 Characters minimum');
                }
                return;
            }
            if (val.length > 25) {
                $createTeamBtn.addClass('disabled');
                $parent.addClass('has-error');
                $help.text('25 Characters maximum');
            }

            for (var i = 0; i < teams.length; i++) {
                var name = teams[i].name.toLowerCase().replace(/\s/g, ''),
                    tag = teams[i].tag ? teams[i].tag.toLowerCase().replace(/\s/g, '') : null;
                if (name == val || tag == val) {
                    $parent.addClass('has-error');
                    $createTeamBtn.addClass('disabled');
                    $help.text('Team Name is already taken');
                }
            }
        });

        $createTeamBtn.on('click', function () {
            var $this = $(this),
                $help = $this.parent().find('.help-block');

            if ($this.hasClass('disabled')) {
                return;
            }

            api.team.newTeam($createTeam.val()).then(function (result) {
                if (result.hasOwnProperty('err') && result.err !== null) {
                    $help.text(result.err);
                } else {
                    redirect(result.url);
                }
            });

        });
    });
});