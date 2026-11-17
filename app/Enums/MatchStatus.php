<?php

namespace App\Enums;

enum MatchStatus: string
{
    case Scheduled = 'scheduled';
    case Postponed = 'postponed';
    case Completed = 'completed';
}
