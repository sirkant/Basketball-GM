//
//  TeamModel.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-22.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import Foundation

struct TeamModel : Codable {
    var id : Int
    var abbreviation : String
    var city : String
    var conference : String
    var division : String
    var full_name : String
    var name : String
}
