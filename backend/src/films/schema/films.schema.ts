import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Screening {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  daytime: string;

  @Prop({ required: true })
  hall: number;

  @Prop({ required: true })
  rows: number;

  @Prop({ required: true })
  seats: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, type: [String] })
  taken: string[];
}

export const ScreeningSchema = SchemaFactory.createForClass(Screening);

@Schema({ collection: 'films' })
export class CinemaFilm extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, min: 0, max: 10 })
  rating: number;

  @Prop({ required: true })
  director: string;

  @Prop({ required: true, type: [String] })
  tags: string[];

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  cover: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  about: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [ScreeningSchema], required: true })
  schedule: Screening[];
}

export const CinemaFilmSchema = SchemaFactory.createForClass(CinemaFilm);
