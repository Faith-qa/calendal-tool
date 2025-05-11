import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'TimeRange', async: false })
export class TimeRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const obj = args.object as any;
    if (typeof obj.startHour === 'number' && typeof value === 'number') {
      return value > obj.startHour;
    }
    return true; // If not both numbers, let other validators handle
  }

  defaultMessage(args: ValidationArguments) {
    return 'endHour must be greater than startHour';
  }
}

export function IsTimeRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTimeRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: TimeRangeConstraint,
    });
  };
} 