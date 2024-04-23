function findSecondLargest(arr) {
    if (arr.length < 2) {
        throw new Error("Array must contain at least two elements.");
    }
    let largest = -Infinity;
    let secondLargest = -Infinity;
    for (let num of arr) {
        if (num > largest) {
            secondLargest = largest;
            largest = num;
        } else if (num > secondLargest && num !== largest) {
            secondLargest = num;
        }
    }
    if (secondLargest === -Infinity) {
        throw new Error("Array must contain at least two distinct elements.");
    }

    return secondLargest;
}

const arr = [3, 9, 1, 4, 2, 8];
const secondLargestNumber = findSecondLargest(arr);
console.log(`The second largest number in the array is: ${secondLargestNumber}`);
