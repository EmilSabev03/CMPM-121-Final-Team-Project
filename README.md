# Devlog Entry - 11/17/2024

## Introducing the team

Tools Lead: Emil

Engine Lead: William/Joey

Design Lead: Eder/Emil

## Tools and materials

We are going to be using Phaser 3 for our final team project. Emil, Eder, William and Joseph have used Phaser 3 in past classes such as CMPM 120 and we feel more comfortable with producing a better project with this framework. We will all be using VS code because it is easily accessible and we have all been using it for a while. For now we are going to be using just the standard libraries, and if that changes then we will update the dev log.

The main language we will be using is Javascript since that is the default Phaser 3 language. We will also be using JSON files to store our art data and HTML to format the webpage. We could also improve the look quality of our game with a CSS file. We have used these languages in previous projects.

To create the images and artwork we will creating pixel art with this free site: https://www.pixilart.com/
To create animations of out of the images we will be using this free website: https://www.free-tex-packer.com/app/
Eder and Emil both have experience with creating pixel art and animations with these tools so we feel comfortable relying on them.

Our alternate platform could be switching from Javascript to Typescript since Phaser 3 accepts both programming languages. Since we've coded in Typescript for this class, we also feel comfortable switching to it as our primary programming language.

## Outlook

Since all of us have used Phaser 3 before, we are hoping to edge others teams in experience using this framework. Since Phaser may not be as popular as other frameworks such as Unity and Unreal Engine, we hope to bring a more polished and unique game using Phaser.

We anticpate that the hardest part of the project will be to fulfill all of the requirements on time for submission. Since there are several specific requirements for each iteration of the project, we may either run out of time or have to rewrite our code several times to fit the new requirements for each iteration. 

We are hoping to learn how to effectively follow one singular shared vision as a team when it comes to making a game. Since we are mostly using tools and materials which we all feel comfortable with, or at least have some experience in, we believe that we will be able to properly communicate our design and implementation ideas with one another to bring our vision to life.

## How we satisfied the software requirements

F0.a - For this requirement, we created a tile map using Tiled and exported it into our project to create a background grid which consists of tiles sized 32x32 pixels. After the grid was added, we also implemented a collision system using Tiled layers, and a layer excusively for farming for the later requirements. After the grid was configured, we added the player character and WASD movement to the scene and made sure it interacted with the Tiled layers properly. This satisfies the requirements for F0.a, because we have a controllable character with WASD moving over a 2D Tiled grid.

F0.b - For this requirement, we initially implemented a very simple on screen timer that represented a number in the format m minutes instead of mm:ss. Pressing T increases this time number by 1. In later stages of the project, specifically F0.f, we modified our timer to be in mm:ss format. We did this using an update time display and pad time function to format and update the time properly if the user increments it. We also implemented the turn based simulation updates after we had the plant sun and water level system set up. More specifically, when the player presses T, every farming tile gets a random increase in their sun and water levels. This satisfies the requirements for F0.b, because the time only advances manually when the player presses T, and the simulation updates (sun, water, plant growth) only when the player presses T, effectively creating a turn based simulation.

F0.c - For this requirement, we initially implemented a plant and reap functionality using placeholder plants which were just bright green squares. In this implementation, if the player presses R, the player will create a green square on the tile they are standing on, and if they press F, then this square will disappear. In later stages of our project, specifically F0.e, we replaced this placeholder with the actual plant sprites. This satisfies the requirements for F0.c, because if the player presses R on the grid square they are currently on, it will plant an object there, and if the player presses F, it will reap that object.

F0.d - For this requirement, we created functions to hold the sun and water levels for each individual farming tile. After those were set up, we used simple Math.random() generation to generate values for the sun and water levels each turn. Because the requirements state that the sun level cannot be stored, if the sun generated a value above 0, it would immediately set it back to 0 right after. The water value would be incremented to the previous water amount in the last turn. To make things easier to see in the game, we also added a grid on screen that helps to differentiate certain farming tiles from others to allow more precise planting and reaping. This satisfies the requirements for F0.d, because we added functionality to track and add sun and water levels to each individual farming tile on the grid. These sun and water levels are generated with the Math.random() function, and only the water level is incremented every turn, while the sun value is lost immediately because of the requirement. 

F0.e - For this requirement, we added sprite images for 3 unique species of plants (Plant1, Plant2, Plant3), and 4 levels of growth for each plant type(Plant1A - Plant1D, Plant2A - Plant2D, Plant3A - Plant3D). We modified our previous plant and reap function to implement the sprite images we added so that if the player presses R now, it will plant a random selection of type A (the first growth level) on the grid, and if the player keeps pressing R it will increment the growth level by 1 by updating the image on the grid. This growth functionality is just a placeholder to show that we have our growth levels set up, and that we can modify it later to fit the future requirements. This satisfies the requirements for F0.e, because we added 3 unique plant types and 4 growth levels for each of these plants, and got it to show and function properly on the player's screen.

F0.f - For this requirement, we added conditions for plant growth that fit our game, but that also fit the requirements for F0.f. Our specific conditions are that any plant which has at least 5 sun, 5 water, and has at least 1 plant nearby it (within 3 tiles), then it is eligible to grow. If a plant is eligible to grow, it will visibly grow automatically on the player's screen, and its sun and water levels will both be subtracted by 5 to ensure it cannot grow again instantly. Additionally, when the player presses R to plant now, it will replace the current plant with one of the 3 level 1 plant types instead of upgrading the level. This satisfies the requirements for F0.f, because we added spatial rules, where at least 1 other plant must be present in a 3 tile range for it to grow, and plant growth is also based on sun and water (minimum 5 sun and 5 water). 

F0.g - For this requirement, we decided to lean into the example listed, where if at least 5 plants reach growth level 4, then a message displays on the screen that says "Phase 1 complete: Grew 5 level 4 plants". This satisfies the requirements for F0.g, because the play scenario "phase 1" has a state that is completed when the player plants 5 plants that reach growth level 4.

## Reflection

Looking back on how we achieved the requirements for F0, our team's plan changed drastically, especially in the earlier stages of the project. We initially wanted to create our own grid using a pixel art editor tool, but when we inspected the F0 requirements more closely, we realized that it would be more logical to satisfy F0.a using a tile map editor tool like Tiled. We've had little experience with Tiled in the past, but experimented a lot in the editor to map out the layers and collision systems that we wanted for our game. After we got Tiled to function and interact properly with the character in our game, we realized that the design/tool leads (Emil and Eder) had to help out the engine leads (William and Joseph) due to the amount of work they had to do to implement the requirements. We often screen shared on discord to look over each other's code, debugged often, and gave each other advice during almost every step of F0 to bring our collaborative vision to life. These were the main changes we noticed during the planning and execution of each F0 requirement.
