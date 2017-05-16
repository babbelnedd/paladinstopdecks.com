'use strict';

module.exports = function mapTier(tier) {
    tier = tier.toString().toLowerCase();
    switch (tier) {
        case 'common':
            return 0;
        case 'uncommon':
            return 1;
        case 'rare':
            return 2;
        case 'epic':
            return 3;
        case 'legendary':
            return 4;
        case '0':
            return 'common';
        case '1':
            return 'uncommon';
        case '2':
            return 'rare';
        case '3':
            return 'epic';
        case '4':
            return 'legendary';
        default:
            return -1;
    }
};