//
//  playByPlay.swift
//  Basketball GM
//
//  Created by Luis Caceres on 2020-05-19.
//  Copyright © 2020 Luis Caceres. All rights reserved.
//

import UIKit

class PlayByPlayController: UITableViewController {
    
    var playByPlay : [String] = []
    
    override func viewDidLoad() {
        self.tableView.dataSource = self
        
        super.viewDidLoad()
    }
    

    
    
    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return playByPlay.count
    }
    
    override func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "playByPlayCell", for: indexPath)
        
        // Configure the cell’s contents.
        cell.textLabel!.text = playByPlay[indexPath.row]
            
        return cell
    }
    
}
