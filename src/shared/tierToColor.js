'use strict';

var colors = {
    specialty: '#c0c0c0',
    common: '#31D83A',
    rare: '#2A76C6',
    epic: '#B737E3',
    legendary: '#FDA519'
};

module.exports = function (tier) {
    tier = tier.toLowerCase();
    if (tier === 'common') {return colors.specialty;}
    if (tier === 'uncommon') {return colors.common;}
    if (tier === 'rare') {return colors.rare;}
    if (tier === 'epic') {return colors.epic;}
    if (tier === 'legendary') {return colors.legendary;}

    throw Error('Tier does not exist');
};