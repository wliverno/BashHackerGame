# Overview
Revamp the storyline to incorporate Alice and Bob and their friends, who all work at Megafirm which is working on building a state of the art quantum computer. We log in as Eve (get it: evesdropping) and are trying to prevent Mallory (get it: malicious) from enacting his evil plan. Each of these characters have home directories with their work files, falling in line with their characters The game incorporates physics and crytography jokes into the gameplay.

# Major plot points
- The first part of the game you are logged in as Eve and the tutorial tells you to look around. The pwd will show you that you are in Eve's home folder, and then you have to go up to see what other users have accounts.
- The first coupling of echo commands can be work related- looking at a memo of tasks to do with easter eggs like a note from the lab manager wondering who keeps kicking the laser table and to stop whistling in the lab because it's causing decoherence
- Perhaps there can be a large csv file in the /var folder with data readings: timestamp, temperature, power (W), efficiency(%), speed (m/s), qubit readings
- Similarly, there could be lab access logs in /var, which could help uncover what Malicious things Mallory is doing to mess up the experiments
## Physics-based
- The chmod command should be used to make ./measure.sh exectutable, and can only run if alice.qubit and bob.qubit files are read/writable (also a chmod command). Running ./measure.sh will change alice.qubit from "SUPERPOSITION" to "ON" and bob.qubit from "SUPERPOSITION" "OFF"
- Mallory tampers with the speed reading in the main log file approaches the speed of light (like 2.99E08 M/S). This causes weird time dilations where the lab access logs report negative timestamps
## Crytography-based
- At some point we are able to copy the .ssh folder from Alice or Bob's directory and use it to login to one of their accounts
- Something about quantum crytography?