import random

my_list = ["rock","paper","scissors"] 
rand_element = random.choice(my_list)
# print(rand_element)

ip_rps = input("type: rock or paper or scissors::")

if(ip_rps == "rock"):
    if(rand_element == "rock"):
        print("rock::its a tie")
    elif(rand_element =="paper"):
        print("paper::you lose")
    else:
        print("scissors::you win")
elif(ip_rps == "paper"):
    if(rand_element == "rock"):
        print("rock::you win")
    elif(rand_element =="paper"):
        print("paper::its a tie")
    else:
        print("scissors::you lose")
elif(ip_rps == "scissors"):
    if(rand_element == "rock"):
        print("rock::you lose")
    elif(rand_element =="paper"):
        print("paper::you win")
    else:
        print("scissors::its a tie")
else:
    print("invalid input")


