// HTML template strings
const templates = {
  champion: ({ championId, name, cost, traits }) =>
    `<div class="champion cost-${cost}" >
        <div class="champion-img" style="background-image: url('img/champions/${championId}.png')"></div>
        <div class="champion-traits">
            ${traits
              .map(
                (trait) => `
                <span class="champion-trait">
                    <img class="trait-icon" src="img/traits/${
                      trait.split("_")[1] || trait
                    }.png" />
                    <span class="trait-name"> ${
                      trait.split("_")[1] || trait
                    }</span>
                </span>`
              )
              .join("")}
        </div>
        <div class="champion-stats">
            <span class="champion-name">${name}</span>
            <span class="champion-cost">${cost}</span>
        </div>
    </div>`,
};

// Function to shuffle the array
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

class Game {
  /**
   *
   * @param {CSS Selector} updateLevelButton
   * @param {CSS Selector} updateStoreButton
   * @param {CSS Selector} championsContainer
   * @param {CSS Selector} statsLevel
   * @param {CSS Selector} statsCoins
   */
  constructor(
    updateLevelButton,
    updateStoreButton,
    championsContainer,
    statsLevel,
    statsCoins
  ) {
    this.levelUpRate = 1;
    // Variable that stores the state of the game
    this.state = {
      coins: 50,
      level: 1,
      currentChampions: [],
    };

    // Pool that stores all the champions available for buying
    this.pool = [];

    // Query select all the CSS selectors provided and store the HTML elements
    this.updateLevelButton = document.querySelector(updateLevelButton);
    this.updateStoreButton = document.querySelector(updateStoreButton);
    this.championsContainer = document.querySelector(championsContainer);
    this.statsLevel = document.querySelector(statsLevel);
    this.statsCoins = document.querySelector(statsCoins);

    // Bind the functions to make them able to execute in the same context at the event listener context
    this.updateStore = this.updateStore.bind(this);
    this.updateLevel = this.updateLevel.bind(this);

    // Add the listeners to the buttons
    this.updateLevelButton.addEventListener("click", this.updateLevel);
    this.updateStoreButton.addEventListener("click", this.updateStore);

    // Start the game settings
    this.createPool();
    this.chooseChampions();
  }

  // Subtract 2 coins from the total ammount and call chooseChampions to get a new selection of champions
  updateStore() {
    this.updateState({
      coins: this.state.coins - 2,
    });
    this.chooseChampions();
  }

  // Update level number and subtract 4 coins from the total ammount
  updateLevel() {
    if (this.state.level >= 9) {
      this.updateLevelButton.disabled = true;
      this.levelUpRate = 0;
    }
    this.updateState({
      level: this.state.level + this.levelUpRate,
      coins: this.state.coins - 4,
    });
  }

  // Updates the current state and refreshes the UI values based on the current state
  updateState(newState) {
    this.state = {
      ...this.state,
      ...newState,
    };

    this.championsContainer.innerHTML = this.state.currentChampions
      .map((champion) => templates.champion(champion))
      .join("");

    this.statsLevel.innerHTML = this.state.level;
    this.statsCoins.innerHTML = this.state.coins;
  }

  // Create the pool based on the ammount for each champion
  createPool() {
    let pool = [];

    // Generate an ID for each champion unit to make it easier to remove them later
    let id = 0;

    // Add an X ammount of each champion on the pool based on the poolsize.js file info
    for (const champion of champions) {
      for (let i = 0; i < poolsize[champion.cost - 1]; i++) {
        if (!pool[champion.cost - 1]) {
          pool[champion.cost - 1] = [];
        }
        pool[champion.cost - 1].push(champion);
      }
    }

    console.log(pool);

    // Shuffle each tier inside the current pool
    for (let i = 0; i < pool.length; i++) {
      pool[i] = shuffle(pool[i]);
    }

    // Index an ID to each champion unit
    for (let i = 0; i < pool.length; i++) {
      pool[i] = pool[i].map((champion) => {
        id += 1;
        return { ...champion, id };
      });
    }

    this.pool = pool;
  }

  // Debugging champion removal
  logPoolSize() {
    console.log(
      this.pool.reduce((acc, cur, index) => {
        return { ...acc, [index + 1]: cur.length };
      }, {})
    );
  }

  // Choose a list of 5 champions based on the choose percentage of the current level
  chooseChampions() {
    let choosables = [];
    let chosens = [];

    // Retrieve how many champions of each tier will enter the choosables array based on the choose percentage of the current level
    const ammounts = levels[this.state.level - 1].map((chance, index) => {
      return Math.round((this.pool[index].length * chance) / 100);
    });

    // Slice from a random point the ammount of champions needed for each tier and concat them on the same array
    for (let i = 0; i < ammounts.length; i++) {
      if (ammounts[i] > 0) {
        let slicePoint = Math.floor(
          Math.random() * (this.pool[i].length - ammounts[i])
        );
        choosables = choosables.concat(
          this.pool[i].slice(slicePoint, slicePoint + ammounts[i])
        );
      }
    }

    // Shuffle the whole choosables array to make it random
    choosables = shuffle(choosables);

    // Slice from a random point the ammount of champions needed for the store: 5
    let slicePoint = Math.floor(Math.random() * (choosables.length - 5));
    chosens = choosables.slice(slicePoint, slicePoint + 5);

    this.logPoolSize();
    // Remove the choosen champions from the current pool to prevent them from appearing again and balancing the choosing chance
    for (const chosen of chosens) {
      this.pool[chosen.cost - 1] = this.pool[chosen.cost - 1].filter(
        (champion) => {
          return champion.id != chosen.id;
        }
      );
    }
    this.logPoolSize();

    this.updateState({ currentChampions: chosens });
  }

  flushData() {}
}

let game = new Game(
  "[data-update-level]",
  "[data-update-store]",
  "[data-champions]",
  "[data-level]",
  "[data-coins]"
);
