import { ObjectOrType } from '@itrocks/class-type'
import { decorate }     from '@itrocks/decorator/property'
import { decoratorOf }  from '@itrocks/decorator/property'

const FORMER_NAME = Symbol('formerName')

export function FormerName<T extends object>(...formerName: string[])
{
	return decorate<T>(FORMER_NAME, formerName)
}

export function formerNameOf<T extends object>(target: ObjectOrType<T>, property: keyof T)
{
	return decoratorOf<string[], T>(target, property, FORMER_NAME, [])
}
