const oneMinuteExpiry = async(otpTime)=>{
    try {
        console.log('Timestamp is '+otpTime);

        const c_dateTime = new Date();
        var differnceValue = (otpTime-c_dateTime.getTime())/1000;
        differnceValue /= 60;

        console.log('expires on '+Math.abs(differnceValue));

        if(Math.abs(differnceValue)>1){
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
    }
}

const threeMinuteExpiry = async(otpTime)=>{
    try {
        console.log('Timestamp is '+otpTime);

        const c_dateTime = new Date();
        var differnceValue = (otpTime-c_dateTime.getTime())/1000;
        differnceValue /= 60;

        console.log('expires on '+Math.abs(differnceValue));

        if(Math.abs(differnceValue)>3){
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    oneMinuteExpiry,
    threeMinuteExpiry
}