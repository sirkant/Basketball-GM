//
//  BoxScore.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-08-27.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

struct BoxScore {
    var player : [String: String] = [:]
    var points : Int = 0
    var assists : Int = 0
    var rebounds : Int = 0
    var steals : Int = 0
    var homeTeamScore : Int = 0
    var awayTeamScore : Int = 0
    var homeTeamTurnovers : Int = 0
    var awayTeamTurnovers : Int = 0
//    var firstQuarterScore : [String : Int]
//    var htScore : [String : Int]
//    var thirdQuarterScore : [String : Int]
}
