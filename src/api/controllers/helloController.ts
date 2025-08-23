import { Request, Response } from 'express';

export const sayHello = (req: Request, res: Response) => {
    res.json({ message: 'yes yes yues' });
};


