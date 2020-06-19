## Game

### Create Game

```
mutation {
  createGame {
    id
    users{
      id
      name
        }
    started
    topic
    roundNumber
    submittedGifs {
      gifId
      id
      content
        }
    }
}
```

### Add User

```
mutation {
	addUser(user:{ name: "RS"}, gameId: "2XMAb-g-d") {
    id
    name
    score
  }
}
```

### Update User

```
mutation {
	updateUser(user:{ name: "SR", id: "5ee96694ebe86612e76afcd9", score: 1}, gameId: "c1EjRDQKx") {
    id
    name
    score
  }
}
```

### Remove User

```
mutation {
	removeUser(user:{ name: "SR", id: "5ee9668debe86612e76afcd8", score: 1}, gameId: "c1EjRDQKx") {
    id
    name
    score
  }
}
```

### Start Game

```
mutation {
	startGame(gameId: "c1EjRDQKx") {
    started
  }
}
```

## Gifs

### Subscription

```
subscription{
  gifChanged(gameId: "c1EjRDQKx") {
    id
    submittedGifs {
      id
      gifId
      content
      userId
      gifSearchText
      numVotes
    }
  }
}
```

### Create Gif

```
mutation{
  createGif(gameId: "c1EjRDQKx", gif: {gifId: "GIFID", userId: "5ee96684ebe86612e76afcd7", content: "sjfhsiughewruigyew"}){
		id
    gifId
    gifSearchText
    content
    userId
    numVotes
}
}
```

## Update Gif

```
mutation{
  updateGif(gameId: "c1EjRDQKx", gif: {gifId: "GIFID2", userId: "5ee96684ebe86612e76afcd7", content: "sjfhsiughewruigyew", numVotes: 5, gifSearchText: "Test Update 2.0"}){
		id
    gifId
    gifSearchText
    content
    userId
    numVotes
}
}
```

## Remove Gif

```
mutation{
  removeGif(gameId: "c1EjRDQKx", gif: {gifId: "GIFID", userId: "5ee96684ebe86612e76afcd7", content: "sjfhsiughewruigyew", numVotes: 41, gifSearchText: "Test Update 4.0"}){
		id
    gifId
    gifSearchText
    content
    userId
    numVotes
}
}
```

## Round

### Subscription

```
subscription{
  roundChanged(gameId: "c1EjRDQKx") {
		roundNumber
  }
}
```

### Update Round Number

```
mutation{
  nextRound(gameId: "c1EjRDQKx", round: {roundNumber: 22})
}
```

## Topic

### Subscription

```
subscription{
  topicChanged(gameId: "c1EjRDQKx")  {
    topic
  }
}
```

### Update Topic

```
mutation{
  updateTopic(gameId: "c1EjRDQKx", topicInput: {topic: "yoyoy"})
}
```
