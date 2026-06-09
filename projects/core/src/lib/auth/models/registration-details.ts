export class RegistrationDetails {
  constructor(
    companyName: string,
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    branch: string,
    region: string,
  ) {
    this.companyName = companyName;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.branch = branch;
    this.region = region;
  }
  companyName: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  branch: string;
  region: string;
}
