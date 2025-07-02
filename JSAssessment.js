import fs from 'node:fs';
import readline from 'node:readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function askQuestion(rl, questionText, regex) {
    const re = new RegExp(regex)
    return new Promise((resolve) => {
        const ask = () => {
            rl.question(questionText, (answer) => {
                if (answer.trim() != '' && re.test(answer)) {
                    resolve(answer);
                } else {
                    console.log('Invalid input. Please try again.');
                    ask();
                }
            });
        };
        ask();
    });
}

function getFile(file) {
    return new Promise(resolve => {
        fs.readFile(file, 'utf8', (error, data) => {
            if (error) {
                console.error(error);
                return;
            }

            let lines = data.split('\r\n').slice(1);
            resolve(lines);
        });
    })
}

function getGender(gender, conditionalData) {
    if (gender === 'f') {
        return conditionalData.filter(item => 
            item && item.toLowerCase().includes('female')
        ).map(item => 
            item.replace(/Sex:=:Female\+?/g, '')
        ).reverse();
    } else {
        return conditionalData.filter(item => 
            item && /\bmale\b/i.test(item) && !/\bfemale\b/i.test(item)
        ).map(item =>
            item.replace(/Sex:=:Male\+/g, '')
        ).reverse();
    }
}

function classifyAge(age, constraints){
    return constraints.filter(item => {
        let leftAge = item.match(/≥:(\d+(?:\.\d+)?)/g);
        leftAge = Number(leftAge[0].replace(/≥:/g, ''));

        let rightAge = item.match(/<:(\d+(?:\.\d+)?)/g);
        rightAge = Number(rightAge[0].replace(/<:/g, ''));
        
        return (age >= leftAge && age < rightAge);
    });
}

async function computeBMI(weight, height) {
    return Number(weight / (height * height)).toFixed(2);
}

function getColumn(data, column) {
    return data.map(line => {
        const columns = line.split(/("[^"]*"|[^,]+)/g);
        return columns ? columns[column].replace(/"/g, '') : null;
    });
}

function findRange(bmi, classifiedAge, columnIndex){
    const refData = getColumn(classifiedAge, columnIndex);
    return refData.map(item => {
        const [min, max] = item.replace(/[\[\]]/g, '').split(',').map(Number);
        return bmi >= min && bmi <= max;
    });
}

async function main() {
    const data = await getFile('Assessment.csv');

    const digitRegex = '^[0-9]+$';
    const gender = await askQuestion(rl, 'Enter your gender (m/f): ', `^(f|m|F|M|male|female|Male|Female)$`);
    let age = await askQuestion(rl, 'Enter your age (in months): ', digitRegex);
    const weight = await askQuestion(rl, 'Enter your weight in kilograms(kg): ', digitRegex);
    const height = await askQuestion(rl, 'Enter your height in meters(m): ', '\d*\.?\d*');
    rl.close();

    const genderConstraint = getGender(gender.at(0).toLowerCase(), data);
    //Convert months to age in years
    age = +(Number(age) / 12).toFixed(2);
    console.log(`\nYear age: ${age}`)

    const classifiedAge = classifyAge(age, genderConstraint);
    console.log(`Classified Age:\n\t${classifiedAge.join('\n\t')}`);

    const bmi = await computeBMI(Number(weight), Number(height));
    console.log(`Your BMI is: ${bmi}`);

    const refResult = findRange(bmi, classifiedAge, 7);
    console.log(`Primary_Ref_Range(s): ${refResult}`)

    const controlValues = findRange(bmi, classifiedAge, 9);
    console.log(`Controlled Value(s): ${controlValues}`);    

}

main()




