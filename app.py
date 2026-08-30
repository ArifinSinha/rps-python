import random
from enum import Enum
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


class RPS(Enum):
    ROCK = 1
    PAPER = 2
    SCISSOR = 3


game_state = {
    "name": "PlayerOne",
    "game_count": 0,
    "player_wins": 0,
    "python_wins": 0,
    "player_history": [],
}

COUNTER = {1: 2, 2: 3, 3: 1}  


def decide_winner(player, computer):
    if player == 1 and computer == 3:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == 2 and computer == 1:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == 3 and computer == 2:
        game_state["player_wins"] += 1
        return f"\U0001F389 {game_state['name']}, you win!"
    elif player == computer:
        return "\U0001F62E Tie game!"
    else:
        game_state["python_wins"] += 1
        return f"\U0001F40D Python wins! Sorry, {game_state['name']}.."


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/set_name", methods=["POST"])
def set_name():
    typed = request.get_json().get("name", "").strip()
    game_state["name"] = typed if typed else "PlayerOne"
    game_state["game_count"] = 0
    game_state["player_wins"] = 0
    game_state["python_wins"] = 0
    game_state["player_history"] = []
    return jsonify({"name": game_state["name"]})


@app.route("/play", methods=["POST"])
def play():
    player = int(request.get_json()["choice"])

    computer = pick_computer_move()

    game_state["player_history"].append(player)
    if len(game_state["player_history"]) > 10:
        game_state["player_history"].pop(0)   # only remember the last 10 picks

    message = decide_winner(player, computer)
    game_state["game_count"] += 1

    return jsonify({
        "message": message,
        "computer": computer,
        "game_count": game_state["game_count"],
        "player_wins": game_state["player_wins"],
        "python_wins": game_state["python_wins"],
    })


def pick_computer_move():
    history = game_state["player_history"]

    # not enough data yet - play randomly, same as before
    if len(history) < 3:
        return int(random.choice("123"))

    # 65% of the time, counter your most frequent recent pick.
    # 35% of the time, still play randomly - so it's not too predictable.
    if random.random() < 0.65:
        recent = history[-5:]  # only look at your last 5 picks
        most_common = max(set(recent), key=recent.count)
        return COUNTER[most_common]
    else:
        return int(random.choice("123"))


if __name__ == "__main__":
    app.run(debug=True)